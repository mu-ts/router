import { Logger, LoggerService } from '@mu-ts/logger';
import { SNSEventRecord, SQSRecord, S3EventRecord, APIGatewayProxyEvent, DynamoDBRecord } from '@mu-ts/modeling';
import { Route } from '../model/Route';
import { RouteOptions } from '../model/RouteOptions';
import { EventType } from '../model/EventType';
import { RouteFilter } from '../interfaces/RouteFilter';

export class RouteRegistry {
  private readonly logger: Logger;
  private readonly registry: Route[];
  private readonly routeFilters: { [key: string]: RouteFilter<any> };

  private static _i: RouteRegistry;

  public constructor() {
    this.logger = LoggerService.named({ name: this.constructor.name, adornments: { '@mu-ts': 'router' } });
    this.registry = [];
    this.routeFilters = {};
    this.logger.debug('init()');
  }

  /**
   * S3 is a singleton, this makes accessing it much easier/neater.
   */
  public static get instance() {
    if (!this._i) this._i = new RouteRegistry();
    return this._i;
  }

  /**
   *
   * @param options to declare a new route using.
   */
  public register(options: RouteOptions): void {
    this.logger.debug('register()', { options });
    const name: string = this.nameFrom(options.target);
    const existing: Route | undefined = this.registry.find(
      (route: Route) => `${name}.${options.propertyKey}` === `${this.nameFrom(route.target)}.${route.propertyKey}`
    );

    /**
     * Skip duplicate calls for the same logical function.
     */
    if (existing) return;

    this.registry.push({ ...new Route(), ...options });

    this.logger.debug('register()', 'After register, registry has:', { length: this.registry.length });
  }

  /**
   * Allows other frameworks to subscribe a greater amount of intelligence, generally
   * more specific logic, for selecting a route.
   *
   * @param evnetType to apply the filtering behavior to.
   * @param filter to execute for the event type specified.
   */
  public setFilter<T>(eventType: EventType, filter: RouteFilter<T>): void {
    this.logger.debug('setFilter()', 'Adding a custom filter for event type.', { eventType });
    this.routeFilters[eventType] = filter;
  }

  /**
   *
   * @param type of the type to get data for. It expects to be a class instance, or class constructor.
   */
  public find(
    events: Array<SNSEventRecord | SQSRecord | S3EventRecord | DynamoDBRecord | APIGatewayProxyEvent>
  ): Route[] {
    this.logger.debug('find()', { events });

    return events.reduce(
      (routes: Route[], event: SNSEventRecord | SQSRecord | S3EventRecord | DynamoDBRecord | APIGatewayProxyEvent) => {
        /**
         * Determine the type of this event, with a 'duck type' searching on attributes that contain it,
         * and if none, assume api-gateway event.
         */
        const eventType: EventType =
          (event as SNSEventRecord).EventSource ||
          (event as SQSRecord | S3EventRecord | DynamoDBRecord).eventSource ||
          'aws:api-gw';

        return routes.concat(
          this.registry
            /** Greedy filter on type */
            .filter((possibleRoute: Route) => possibleRoute.eventType === eventType)
            /** Filter by provided filter, if it exists. */
            .filter(
              (possibleRoute: Route) =>
                !this.routeFilters[eventType] || this.routeFilters[eventType](event, possibleRoute)
            )
        );
      },
      [] as Route[]
    );
  }

  /**
   *
   * @param type normalized into a string value.
   */
  private nameFrom<T>(type: T): string {
    if (typeof type !== 'function' && typeof type !== 'object')
      throw new TypeError(`You must provide a constructor, or instance, for target (${typeof type}).`);

    return (type as any).name || type.constructor.name;
  }
}

// aws:dynamodb
// "eventName": "INSERT",
// "eventSourceARN": eventsourcearn,

// "aws:sqs",
// "eventSourceARN": "arn:aws:sqs:us-east-2:123456789012:my-queue"

// aws:sns
// EventSubscriptionArn": "arn:aws:sns:us-east-2:123456789012:sns-lambda:21be56ed-a058-49f5-8c98-aedd2564c486",

// https://docs.aws.amazon.com/lambda/latest/dg/with-s3.html
// aws:s3
// const eventName: string = (record as S3EventRecord).eventName
