import { EventType } from './EventType';
import { Validation } from './Validation';

export class RouteOptions {
  eventType: EventType;
  target: any;
  propertyKey: string;
  descriptor: PropertyDescriptor;
  validation?: Validation;
}
