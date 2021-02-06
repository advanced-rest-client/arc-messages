/* eslint-disable class-methods-use-this */
import { LitElement, html } from 'lit-element';
import { AnypointDialogMixin, AnypointDialogStylesInternal } from '@anypoint-web-components/anypoint-dialog';
import { ArcNavigationEvents } from '@advanced-rest-client/arc-events';
import '@anypoint-web-components/anypoint-dialog/anypoint-dialog-scrollable.js';
import '@anypoint-web-components/anypoint-button/anypoint-button.js';
import '@advanced-rest-client/date-time/date-time.js';
import elementStyles from './styles/MessagesDialog.js';

/** @typedef {import('lit-element').TemplateResult} TemplateResult */
/** @typedef {import('./types').ArcAppMessage} ArcAppMessage */

export const messagesListTemplate = Symbol('messagesListTemplate');
export const messageTemplate = Symbol('messageTemplate');
export const emptyTemplate = Symbol('emptyTemplate');
export const openMessageHandler = Symbol('openMessageHandler');

export class ArcMessagesDialogElement extends AnypointDialogMixin(LitElement) {
  static get styles() {
    return [elementStyles, AnypointDialogStylesInternal];
  }

  static get properties() {
    return {
      /** 
       * Enables compatibility theme for Anypoint
       */
      compatibility: { type: Boolean, reflect: true, },
      /** 
       * The list of application messages to render.
       */
      messages: { type: Array },
    };
  }

  constructor() {
    super();
    this.compatibility = false;
    /** 
     * @type {ArcAppMessage[]}
     */
    this.messages = undefined;
  }

  /**
   * @param {Event} e
   */
  [openMessageHandler](e) {
    const anchor = /** @type HTMLAnchorElement */ (e.target);
    const { href } = anchor;
    ArcNavigationEvents.navigateExternal(this, href);
    e.preventDefault();
  }

  render() {
    const { opened } = this;
    if (!opened) {
      return html``;
    }
    return html`
    <h2>What's new</h2>
    <anypoint-dialog-scrollable .dialogElement="${this}">
      ${this[messagesListTemplate]()}
    </anypoint-dialog-scrollable>
    <div class="buttons">
      <anypoint-button ?compatibility="${this.compatibility}" data-dialog-dismiss>Close</anypoint-button>
    </div>
    `;
  }
  
  /**
   * @returns {TemplateResult} The template for the empty message list info.
   */
  [emptyTemplate]() {
    return html`
    <p>There are no messages available at the moment.</p>
    `;
  }

  /**
   * @returns {TemplateResult} The template for the messages list
   */
  [messagesListTemplate]() {
    const { messages } = this;
    if (!Array.isArray(messages) || !messages.length) {
      return this[emptyTemplate]();
    }
    return html`
    <div class="list">${messages.map((msg) => this[messageTemplate](msg))}</div>
    `;
  }

  /**
   * @param {ArcAppMessage} message The message to render.
   * @returns {TemplateResult} The template for a message item.
   */
  [messageTemplate](message) {
    const { abstract, time, title, actionurl, cta } = message;
    return html`
    <div class="message">
      <p class="time">
        <date-time
          .date="${time}"
          year="numeric"
          month="long"
          day="numeric"
          hour="numeric"
          minute="numeric"></date-time>
      </p>
      <h3>${title}</h3>
      <p class="abstract">${abstract}</p>
      ${actionurl && cta ? html`
      <div class="action">
        <a target="_blank" href="${actionurl}" @click="${this[openMessageHandler]}">${cta}</a>
      </div>
      ` : ''}
    </div>
    `;
  }
}
