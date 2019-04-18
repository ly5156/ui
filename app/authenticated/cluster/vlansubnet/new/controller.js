import { inject as service } from '@ember/service';
import { get, set } from '@ember/object';
import Controller from '@ember/controller';

export default Controller.extend({
  vlansubnet: service(),
  errors:     null,
  form:       {
    apiVersion: 'staticmacvlan.rancher.com/v1',
    kind:       'VLANSubnet',
    metadata:   {
      name:      '',
      namespace: 'kube-system'
    },
    spec: {
      master: '',
      cidr:   ''
    }
  },
  init() {
    this._super(...arguments);
    set(this, 'form', {
      apiVersion: 'staticmacvlan.rancher.com/v1',
      kind:       'VLANSubnet',
      metadata:   {
        name:      '',
        namespace: 'kube-system'
      },
      spec: {
        master: '',
        cidr:   ''
      }
    });
  },
  actions: {
    save(cb) {
      if (!this.validate()) {
        cb(false);

        return;
      }
      const form = get(this, 'form');
      const clusterId = get(this, 'model.clusterId');

      this.vlansubnet.createVlansubnets(clusterId, form).then(() => {
        this.resetForm();
        cb(true);
        this.send('goToPrevious');
      }).catch((err) => {
        set(this, 'errors', [err.body.message]);
        cb(false);
      });
    },
    cancel() {
      this.resetForm();
      this.send('goToPrevious');
    },
  },
  resetForm() {
    set(this, 'form.metadata.name', '');
    set(this, 'form.metadata.namespace', '');
    set(this, 'form.spec.master', '');
    set(this, 'form.spec.cidr', '');
  },
  validate() {
    const form = get(this, 'form');
    const errors = [];

    if (form.metadata.name === '') {
      errors.push('名称不能为空');
    }

    if (form.spec.master === '') {
      errors.push('master 不能为空');
    }

    if (form.spec.cidr === '') {
      errors.push('CIDR 不能为空');
    }
    if (errors.length > 0) {
      set(this, 'errors', errors);

      return false;
    }
    set(this, 'errors', null);

    return true;
  },
});
