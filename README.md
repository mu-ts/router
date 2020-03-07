Event dispatching for AWS functions handling multiple AWS events.

# Example

At the entry point of your function, just pass all event executions to the `.handle()` function of the global `Router`.

```
import { Context } from '@mu-ts/modeling';
import { Router } from '@mu-ts/router';

export const handle = (event:any, context:Context) => Router.handle(event,context);
```