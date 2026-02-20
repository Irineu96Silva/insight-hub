
import { IncomingMessage, ServerResponse } from 'http';
import { Readable } from 'stream';

export class CloudflareAdapter {
  static async handle(app: any, request: Request, env: any, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    
    // Create a mock IncomingMessage
    const req = new Readable() as any;
    req._read = () => {};
    req.url = url.pathname + url.search;
    req.method = request.method;
    req.headers = {};
    
    // Copy headers
    for (const [key, value] of request.headers.entries()) {
      req.headers[key.toLowerCase()] = value;
    }
    
    // Pipe body if present
    if (request.body) {
      // @ts-ignore
      forComponent(request.body, (chunk) => req.push(Buffer.from(chunk)));
      req.push(null);
    } else {
        req.push(null);
    }

    // Create a mock ServerResponse
    return new Promise<Response>((resolve, reject) => {
        const res = new ServerResponse(req) as any;
        let statusCode = 200;
        let responseHeaders = new Headers();
        let bodyChunks: any[] = [];

        res.statusCode = 200;
        
        res.writeHead = (status: number, headers: any) => {
            statusCode = status;
            if (headers) {
                for (const key in headers) {
                    responseHeaders.set(key, headers[key]);
                }
            }
            return res;
        };

        res.setHeader = (name: string, value: string) => {
            responseHeaders.set(name, value);
            return res;
        };

        res.getHeader = (name: string) => responseHeaders.get(name);

        res.write = (chunk: any) => {
            bodyChunks.push(Buffer.from(chunk));
            return true;
        };

        res.end = (chunk: any) => {
            if (chunk) bodyChunks.push(Buffer.from(chunk));
            const body = Buffer.concat(bodyChunks);
            resolve(new Response(body, {
                status: statusCode,
                headers: responseHeaders
            }));
            res.emit('finish');
        };

        // Execute Express/Nest handler
        app(req, res);
    });
  }
}

// Helper to iterate readable stream if needed (simplified)
async function forComponent(stream: ReadableStream, callback: (chunk: any) => void) {
    const reader = stream.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        callback(value);
    }
}
