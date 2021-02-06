import { LitElement, TemplateResult, CSSResult } from 'lit-element';
import { AnypointDialogMixin } from '@anypoint-web-components/anypoint-dialog';
import { ArcAppMessage } from './types';

export const messagesListTemplate: unique symbol;
export const messageTemplate: unique symbol;
export const emptyTemplate: unique symbol;
export const openMessageHandler: unique symbol;

export class ArcMessagesDialogElement extends AnypointDialogMixin(LitElement) {
  static get styles(): CSSResult[];

  /** 
   * Enables compatibility theme for Anypoint
   * @attribute
   */
  compatibility: boolean;
  /** 
   * The list of application messages to render.
   */
  messages: ArcAppMessage[];

  constructor();

  [openMessageHandler](e: Event): void;

  render(): TemplateResult;
  
  /**
   * @returns The template for the empty message list info.
   */
  [emptyTemplate](): TemplateResult;

  /**
   * @returns The template for the messages list
   */
  [messagesListTemplate](): TemplateResult;

  /**
   * @param message The message to render.
   * @returns The template for a message item.
   */
  [messageTemplate](message: ArcAppMessage): TemplateResult;
}
