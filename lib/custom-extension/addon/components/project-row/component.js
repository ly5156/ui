import Component from '@ember/component';
import layout from './template';
import { get } from '@ember/object';

export default Component.extend({
  layout,
  model:      null,
  isLocal:    null,

  tagName:         'TR',
  classNames:      'main-row',
  resourceActions: [
    {
      label:  'action.remove',
      icon:     'icon icon-trash',
      action: 'remove'
    },
  ],
  actions: {
    handleMenuClick(command) {
      this.sendAction('command', command, get(this, 'model'));
    }
  }
});