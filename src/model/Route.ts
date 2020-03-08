import { EventType } from './EventType';
import { Validation } from './Validation';

export class Route {
  eventType: EventType;
  target: any;
  propertyKey: string;
  descriptor: PropertyDescriptor;
  validation?: Validation;
}
