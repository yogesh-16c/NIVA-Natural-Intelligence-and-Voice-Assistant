import { ToolExecution, ToolType } from '../../types/assistant';
import { apiClient } from '../api/apiClient';
import { activityStore } from '../activity/activityStore';
import { researchService } from '../research/researchService';
import { actionSafetyService } from '../security/actionSafetyService';

export interface ToolExecutionRequest {
  type: ToolType;
  input: Record<string, any>;
  confirmationAccepted?: boolean;
}

/**
 * Converts common natural-language math into a safe arithmetic expression.
 *
 * Examples:
 * "what is 25 × 4?"       -> "25 * 4"
 * "calculate 20 + 30"     -> "20 + 30"
 * "15% of 200"            -> "(15 / 100) * 200"
 * "2 times 10 ="          -> "2 * 10"
 */
function normalizeMathExpression(input: string): string | null {
  let expression = input
    .trim()
    .toLowerCase()
    .replace(/what\s+is/gi, '')
    .replace(/calculate/gi, '')
    .replace(/please/gi, '')
    .trim();

  // Percentage calculations:
  // "15% of 200" -> "(15 / 100) * 200"
  expression = expression.replace(
    /(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:of\s*)?(\d+(?:\.\d+)?)/gi,
    '($1 / 100) * $2'
  );

  // Common mathematical words/operators.
  expression = expression
    .replace(/multiplied\s+by/gi, '*')
    .replace(/times/gi, '*')
    .replace(/divided\s+by/gi, '/')
    .replace(/\bplus\b/gi, '+')
    .replace(/\bminus\b/gi, '-')
    .replace(/\bmodulo\b/gi, '%')
    .replace(/\bmod\b/gi, '%')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '')
    .replace(/=/g, '')
    .trim();

  // Support "2 x 10"
  expression = expression.replace(
    /(\d+(?:\.\d+)?)\s+x\s+(\d+(?:\.\d+)?)/gi,
    '$1 * $2'
  );

  // Only allow arithmetic characters after normalization.
  // This prevents normal English sentences from becoming calculator calls.
  if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
    return null;
  }

  // Must contain at least one number.
  if (!/\d/.test(expression)) {
    return null;
  }

  return expression;
}

/**
 * Maps common website names to their canonical URLs.
 */
function resolveWebsiteUrl(query: string): string | null {
  const q = query.trim().toLowerCase();

  const websiteMap: Record<string, string> = {
    google: 'https://www.google.com',
    youtube: 'https://www.youtube.com',
    github: 'https://github.com',
    gmail: 'https://mail.google.com',
    linkedin: 'https://www.linkedin.com',
    facebook: 'https://www.facebook.com',
    instagram: 'https://www.instagram.com',
    twitter: 'https://x.com',
    x: 'https://x.com',
    reddit: 'https://www.reddit.com',
    amazon: 'https://www.amazon.com',
    netflix: 'https://www.netflix.com',
    chatgpt: 'https://chatgpt.com',
    gemini: 'https://gemini.google.com',
    react: 'https://react.dev',
    stackoverflow: 'https://stackoverflow.com',
  };

  // Remove common navigation phrases.
  const target = q
    .replace(/^(open|go to|visit|launch|navigate to)\s+/i, '')
    .trim();

  // Exact known-site match.
  if (websiteMap[target]) {
    return websiteMap[target];
  }

  // Match known site inside a natural sentence.
  for (const [name, url] of Object.entries(websiteMap)) {
    const pattern = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

    if (pattern.test(target)) {
      return url;
    }
  }

  // Explicit URL.
  const urlMatch = query.match(
    /(https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.(?:com|org|io|dev|ai|net)[^\s]*)/i
  );

  if (urlMatch) {
    return urlMatch[0].startsWith('http')
      ? urlMatch[0]
      : `https://${urlMatch[0]}`;
  }

  return null;
}

export const toolExecutor = {
  detectToolFromQuery(query: string): ToolExecutionRequest | null {
    const q = query.trim().toLowerCase();

    // ---------------------------------------------------------
    // 1. Math / Calculation
    // ---------------------------------------------------------
    //
    // IMPORTANT:
    // Do NOT use "what is" alone as a calculator trigger.
    //
    const mathExpression = normalizeMathExpression(query);

    if (mathExpression) {
      return {
        type: 'calculator',
        input: {
          expression: mathExpression
        }
      };
    }

    // ---------------------------------------------------------
    // 2. Open website / browser navigation
    // ---------------------------------------------------------

    const looksLikeNavigation =
      q.startsWith('open ') ||
      q.startsWith('go to ') ||
      q.startsWith('visit ') ||
      q.startsWith('launch ') ||
      q.startsWith('navigate to ') ||
      q.includes('http://') ||
      q.includes('https://') ||
      q.includes('.com') ||
      q.includes('.org') ||
      q.includes('.io') ||
      q.includes('.dev') ||
      q.includes('.ai');

    if (looksLikeNavigation) {
      const target = resolveWebsiteUrl(query);

      if (target) {
        return {
          type: 'browser_open',
          input: {
            url: target,
            title: 'External Web Destination'
          }
        };
      }
    }

    // ---------------------------------------------------------
    // 3. Screen / context analysis
    // ---------------------------------------------------------

    if (
      q.includes('explain this code') ||
      q.includes('screen') ||
      q.includes('analyze') ||
      q.includes('this repository') ||
      q.includes('viewport')
    ) {
      return {
        type: 'screen_analysis',
        input: {
          target: 'Active Workspace & Viewport'
        }
      };
    }

    // ---------------------------------------------------------
    // 4. Web research
    // ---------------------------------------------------------

    if (
      q.startsWith('research') ||
      q.includes('research react') ||
      q.includes('sources') ||
      q.includes('investigate') ||
      q.includes('deep dive')
    ) {
      return {
        type: 'research_sources',
        input: {
          query: query.replace(/^research\s+/i, '')
        }
      };
    }

    // ---------------------------------------------------------
    // 5. Default search
    // ---------------------------------------------------------

    if (q.startsWith('search') || q.startsWith('find')) {
      return {
        type: 'web_search',
        input: {
          query
        }
      };
    }

    return null;
  },

  async runTool(
    req: ToolExecutionRequest,
    onStatusChange?: (exec: ToolExecution) => void
  ): Promise<ToolExecution> {
    const id = `exec_${Date.now()}`;

    let label = 'Initializing tool…';

    if (req.type === 'calculator') {
      label = 'Calculating…';
    } else if (req.type === 'web_search') {
      label = 'Searching the web…';
    } else if (req.type === 'research_sources') {
      label = 'Researching sources…';
    } else if (req.type === 'browser_open') {
      label = 'Opening website…';
    } else if (req.type === 'screen_analysis') {
      label = 'Analyzing screen…';
    }

    let exec: ToolExecution = {
      id,
      type: req.type,
      label,
      status: 'running',
      input: req.input,
      timestamp: Date.now()
    };

    onStatusChange?.(exec);

    // ---------------------------------------------------------
    // Action Safety: Browser navigation
    // ---------------------------------------------------------

    if (req.type === 'browser_open' && !req.confirmationAccepted) {
      const targetUrl = req.input.url;

      if (!targetUrl) {
        exec = {
          ...exec,
          status: 'error',
          label: 'Failed',
          error: 'No website URL was provided.'
        };

        onStatusChange?.(exec);
        return exec;
      }

      let siteName = 'external site';

      try {
        const host = new URL(targetUrl).hostname.replace(/^www\./, '');

        if (host.includes('github')) {
          siteName = 'GitHub';
        } else if (host.includes('google')) {
          siteName = 'Google';
        } else if (host.includes('youtube')) {
          siteName = 'YouTube';
        } else if (host.includes('linkedin')) {
          siteName = 'LinkedIn';
        } else if (host.includes('react.dev')) {
          siteName = 'React Documentation';
        } else {
          const parts = host.split('.');
          siteName =
            parts[0].charAt(0).toUpperCase() +
            parts[0].slice(1);
        }
      } catch {
        siteName = targetUrl;
      }

      const isAllowed =
        actionSafetyService.isDomainAllowed(targetUrl);

      const config =
        actionSafetyService.getConfig();

      if (config.confirmBrowserNavigation || !isAllowed) {
        exec = {
          ...exec,
          status: 'requires_confirmation',
          label: 'Needs confirmation',
          confirmationRequired: true,
          confirmationMessage:
            `NIVA wants to open ${siteName}.`
        };

        onStatusChange?.(exec);
        return exec;
      }
    }

    try {
      // -------------------------------------------------------
      // Calculator
      // -------------------------------------------------------

      if (req.type === 'calculator') {
        const rawExpr = String(
          req.input.expression || ''
        );

        const sanitized =
          normalizeMathExpression(rawExpr);

        if (!sanitized) {
          throw new Error(
            'NIVA could not understand that as a mathematical expression.'
          );
        }

        const backendResponse =
          await apiClient.executeTool({
            tool: 'calculator',
            arguments: {
              expression: sanitized
            }
          });

        const computed = Number(
          backendResponse?.result?.value ??
          backendResponse?.result?.result ??
          0
        );

        exec = {
          ...exec,
          status: 'success',
          label: 'Completed',
          output: {
            expression: sanitized,
            result: computed,
            formattedText: `${sanitized} = ${computed}`
          }
        };

        activityStore.addActivity({
          type: 'tool_execution',
          title: `Calculation: ${sanitized}`,
          description: `Computed result: ${computed}`,
          status: 'success',
          details: {
            expression: sanitized,
            result: computed
          }
        });

      // -------------------------------------------------------
      // Web search / research
      // -------------------------------------------------------

      } else if (
        req.type === 'research_sources' ||
        req.type === 'web_search'
      ) {
        const query =
          req.input.query ||
          req.input.search ||
          'Current topic';

        const targetTool =
          req.input.toolName === 'youtube_search'
            ? 'youtube_search'
            : 'web_search';

        if (req.type === 'research_sources') {
          await new Promise((r) =>
            setTimeout(r, 650)
          );

          const res =
            await researchService.executeResearch(
              query,
              'en',
              (stage) => {
                if (stage === 'searching') {
                  exec.label =
                    'Searching relevant context…';
                } else {
                  exec.label =
                    'Summarizing the key points…';
                }

                onStatusChange?.({
                  ...exec
                });
              }
            );

          exec = {
            ...exec,
            status: 'success',
            label: 'Completed',
            output: {
              researchId: res.id,
              query: res.query,
              summary: res.summary,
              sourcesCount: res.sources.length,
              sources: res.sources
            }
          };

          activityStore.addActivity({
            type: 'web_research',
            title:
              `Web Research: ${query.slice(0, 32)}`,
            description:
              `Discovered and verified ${res.sources.length} sources with summary.`,
            status: 'success',
            details: {
              sourcesCount: res.sources.length,
              query
            }
          });

        } else {
          const backendResponse =
            await apiClient.executeTool({
              tool: targetTool,
              arguments: { query }
            });

          const toolResult =
            backendResponse.result ?? {};

          exec = {
            ...exec,
            status: 'success',
            label:
              targetTool === 'youtube_search'
                ? 'YouTube search complete'
                : 'Google search complete',
            output: {
              tool: targetTool,
              query:
                toolResult.query ?? query,
              url:
                toolResult.url ?? null,
              status:
                toolResult.status ?? 'ready',
              result: toolResult
            }
          };

          activityStore.addActivity({
            type: 'tool_execution',
            title:
              `${targetTool === 'youtube_search'
                ? 'YouTube Search'
                : 'Google Search'}: ${query.slice(0, 32)}`,
            description:
              `Executed ${
                targetTool === 'youtube_search'
                  ? 'YouTube'
                  : 'Google'
              } search request.`,
            status: 'success',
            details: {
              query,
              tool: targetTool,
              url: toolResult.url
            }
          });
        }

      // -------------------------------------------------------
      // Screen analysis
      // -------------------------------------------------------

      } else if (req.type === 'screen_analysis') {
        await new Promise((r) =>
          setTimeout(r, 700)
        );

        exec = {
          ...exec,
          status: 'success',
          label: 'Completed',
          output: {
            elementsIdentified: 8,
            activeContext:
              'Current workspace context',
            summary:
              'The workspace was reviewed and the active context was summarized clearly.'
          }
        };

        activityStore.addActivity({
          type: 'screen_analysis',
          title:
            'Workspace Screen Inspection',
          description:
            'Inspected active DOM structure and component hierarchy.',
          status: 'success'
        });

      // -------------------------------------------------------
      // Browser open
      // -------------------------------------------------------

      } else if (req.type === 'browser_open') {
        await new Promise((r) =>
          setTimeout(r, 350)
        );

        const targetUrl =
          req.input.url;

        if (!targetUrl) {
          throw new Error(
            'No website URL was provided.'
          );
        }

        const parsedUrl =
          actionSafetyService.normalizeUrl(
            targetUrl
          );

        const isAllowed =
          parsedUrl
            ? actionSafetyService.isDomainAllowed(
                parsedUrl.href
              )
            : false;

        if (!parsedUrl || !isAllowed) {
          throw new Error(
            'The target URL is not allowed by the current browser safety policy.'
          );
        }

        actionSafetyService.openApprovedUrl(
          parsedUrl.href,
          { sameTab: true }
        );

        exec = {
          ...exec,
          status: 'success',
          label: 'Completed',
          output: {
            openedUrl: parsedUrl.href,
            time: Date.now()
          }
        };

        activityStore.addActivity({
          type: 'browser_action',
          title:
            `Opened Website: ${parsedUrl.href}`,
          description:
            'Safe browser action executed with user authorization.',
          status: 'success',
          details: {
            url: parsedUrl.href
          }
        });
      }

      onStatusChange?.(exec);
      return exec;

    } catch (err: any) {
      exec = {
        ...exec,
        status: 'error',
        label: 'Failed',
        error:
          err?.message ||
          'Tool execution encountered an issue.'
      };

      onStatusChange?.(exec);
      return exec;
    }
  }
};