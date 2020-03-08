import { SNSEventRecord, SQSRecord, S3EventRecord, APIGatewayProxyEvent, DynamoDBRecord } from '@mu-ts/modeling';
import { Route } from '../model/Route';

/**
 * This allows implementations specific to an AWS service to define and own
 * how events are filtered down to a specific route to execute.
 */
export interface RouteFilter<
  T extends SNSEventRecord | SQSRecord | S3EventRecord | DynamoDBRecord | APIGatewayProxyEvent
> {
  (event: T, route: Route): boolean;
}
