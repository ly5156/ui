import Mixin from '@ember/object/mixin';
import { get, set } from '@ember/object';
import { requiredError } from 'shared/utils/util';

export default Mixin.create({
  answers:        null,
  optionalFields: null,
  name:           null,

  init() {
    this._super(...arguments);

    Object.keys(this.answers).forEach((key) => {
      if (this.shouldInit && this.initAnswers && this.initAnswers[this.answers[key]]) {
        set(this, key, this.initAnswers[this.answers[key]]);
      }

      if ( !this.shouldInit && this.defaults && this.defaults[key] !== undefined ) {
        set(this, key, this.defaults[key]);
      }

      this.addObserver(key, this, () => {
        const objectStorageConfig = {};

        Object.keys(this.answers).forEach((key) => {
          const value = get(this, key);

          if ( value !== undefined && value !== '' ) {
            objectStorageConfig[this.answers[key]] = value;
          }
        });

        set(this, 'model.objectStorageConfig', objectStorageConfig);
        this.validate();
      });
    });
    this.validate();
  },

  validate() {
    const errors = [];

    Object.keys(this.answers).forEach((key) => {
      if ( !get(this, key) && get(this, key) !== 0 && ((this.optionalFields || []).indexOf(key) === -1 ) ) {
        errors.pushObject(requiredError(`globalMonitoringPage.store.${ this.name }.${ key }.label`));
      }
    })

    set(this, 'model.objectStorageConfigErrors', errors);

    return errors;
  }

});
