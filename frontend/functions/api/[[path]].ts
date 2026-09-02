interface Env {
  API?: Fetcher;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  // If Worker Service Binding is available (0ms internal edge invocation)
  if (context.env.API) {
    return context.env.API.fetch(context.request);
  }

  // Fallback: proxy to Cloudflare Workers custom domain (api-globe.arafz.id)
  const url = new URL(context.request.url);
  const backendBase = 'https://api-globe.arafz.id';
  const targetUrl = new URL(url.pathname + url.search, backendBase);

  const modifiedRequest = new Request(targetUrl.toString(), {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
    redirect: 'follow',
  });

  return fetch(modifiedRequest);
};
