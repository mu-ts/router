import { Logger, LoggerService } from '@mu-ts/logger';
import {
  Context,
  SNSEvent,
  SNSEventRecord,
  SQSEvent,
  SQSRecord,
  S3Event,
  S3EventRecord,
  DynamoDBStreamEvent,
  APIGatewayProxyEvent,
  DynamoDBRecord,
} from '@mu-ts/modeling';

import { RouteRegistry } from './RouteRegistry';
import { Route } from '../model/Route';
import { EventType } from '../model/EventType';

export class Router {
  private readonly logger: Logger;
  private readonly routeRegistry: RouteRegistry;

  private static _i: Router;

  private constructor() {
    this.logger = LoggerService.named({ name: this.constructor.name, adornments: { '@mu-ts': 'router' } });
    this.routeRegistry = RouteRegistry.instance;
    this.logger.debug('init()');
  }

  /**
   * S3 is a singleton, this makes accessing it much easier/neater.
   */
  public static get instance() {
    if (!this._i) this._i = new Router();
    return this._i;
  }

  public async handle(
    event: SNSEvent | SQSEvent | S3Event | DynamoDBStreamEvent | APIGatewayProxyEvent,
    context: Context
  ): Promise<any | void> {
    try {
      const events: Array<SNSEventRecord | SQSRecord | S3EventRecord | DynamoDBRecord | APIGatewayProxyEvent> = [];

      /**
       * Duck typing to determine which event was passed in.
       */
      if ((event as SNSEvent | SQSEvent | S3Event | DynamoDBStreamEvent).Records) {
        /**
         * Each record is its own event, so respect them individually.
         */
        (event as SNSEvent | SQSEvent | S3Event | DynamoDBStreamEvent).Records.forEach(
          (record: SNSEventRecord | SQSRecord | S3EventRecord | DynamoDBRecord) => {
            events.push(record);
          }
        );
      } else {
        /**
         * We assume that if there is no .Records on it then its assumed its an api gateway event.
         */
        this.logger.debug('for()', 'Type is assumed to be aws:api-gw, because it does not have Records on it.');
        events.push(event as APIGatewayProxyEvent);
      }

      /**
       * Get all of the route options, for the events provided.
       */
      const routes: Route[] = this.routeRegistry.find(events);

      if (routes.length > 1) {
        this.logger.warn('There was more than one route resolved for the event.', 'handle()', { routes });
      }
    } catch (error) {
      this.logger.error('Problem while trying to handle the event.', 'handle()', error);
      // TODO Depending on the event process response.
    }
  }
}
