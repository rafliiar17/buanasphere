interface Env {
  API?: Fetcher;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  // If Worker Service Binding is available (0ms internal edge invocation)
  if (context.env.API) {
    return context.env.API.fetch(context.request);
  }

  // Fallback: proxy to Cloudflare Workers endpoint
  const url = new URL(context.request.url);
  const backendBase = 'https://kurs-world-api.rafztesting.workers.dev';
  const targetUrl = new URL(url.pathname + url.search, backendBase);

  const modifiedRequest = new Request(targetUrl.toString(), {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
    redirect: 'follow',
  });

  return fetch(modifiedRequest);
};
