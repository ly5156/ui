import { schedule } from '@ember/runloop';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Controller, { inject as controller } from '@ember/controller';
import C from 'ui/utils/constants';
import { computed, get } from '@ember/object';
import { on } from '@ember/object/evented';

export default Controller.extend({
  settings:    service(),
  prefs:       service(),
  scope:       service(),
  application: controller(),
  error:       null,

  isPopup:     alias('application.isPopup'),
  pageScope:   alias('scope.currentPageScope'),

  sidebar:     computed(`prefs.${ C.PREFS.MENU }`, function() {
    return get(this, `prefs.${ C.PREFS.MENU }`) !== 'top';
  }),
  bootstrap: on('init', function() {
    schedule('afterRender', this, () => {
      this.get('application').setProperties({
        error:             null,
        error_description: null,
        state:             null,
      });

      let bg = this.get(`prefs.${ C.PREFS.BODY_BACKGROUND }`);

      if ( bg ) {
        $('BODY').css('background', bg); // eslint-disable-line
      }
    });
  }),

  hasHosts: computed('model.hosts.length', function() {
    return (this.get('model.hosts.length') > 0);
  }),

});
