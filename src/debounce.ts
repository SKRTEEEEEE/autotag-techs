import * as http from 'http';


type RequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void;

export function debounce<DebounceFunction extends (...args: any[])=>void>(func:DebounceFunction, wait: number): (...args: Parameters<DebounceFunction>)=>void{
    let timeout: ReturnType<typeof setTimeout>;
    return function(this:unknown, ...args: Parameters<DebounceFunction>){
        
        clearTimeout(timeout);
        timeout = setTimeout(() =>{
            func.apply(this, args);
        
        }, wait);
    };

}

export function debounceHandler(handler: RequestHandler, wait: number): RequestHandler {
  const debouncedFunction = debounce(handler, wait);
  return (req: http.IncomingMessage, res: http.ServerResponse) => {
    debouncedFunction(req, res);
  };
}