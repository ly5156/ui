import { inject as service } from '@ember/service';
import { get, set } from '@ember/object';
import Controller from '@ember/controller';

export default Controller.extend({
  vlansubnet: service(),
  errors:     null,
  modes:      [
    {
      label: 'bridge',
      value: 'bridge',
    },
    {
      label: 'private',
      value: 'private',
    },
    {
      label: 'vepa',
      value: 'vepa',
    },
    {
      label: 'passthru',
      value: 'passthru',
    }
  ],
  form:       {
    apiVersion: 'macvlan.cluster.cattle.io/v1',
    kind:       'MacvlanSubnet',
    metadata:   {
      name:      '',
      namespace: 'kube-system'
    },
    spec: {
      master:  '',
      vlan:    2,
      cidr:    '',
      mode:    'bridge',
      gateway: '',
    }
  },
  init() {
    this._super(...arguments);
    set(this, 'form', {
      apiVersion: 'macvlan.cluster.cattle.io/v1',
      kind:       'MacvlanSubnet',
      metadata:   {
        name:      '',
        namespace: 'kube-system'
      },
      spec: {
        master:  '',
        vlan:    '',
        cidr:    '',
        mode:    'bridge',
        gateway: '',

      }
    });
  },
  actions: {
    save(cb) {
      if (!this.validate()) {
        cb(false);

        return;
      }
      const form = JSON.parse(JSON.stringify(get(this, 'form')));

      if (form.spec.vlan === '') {
        delete form.spec.vlan
      } else {
        form.spec.vlan = parseInt(form.spec.vlan, 10);
      }
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

    if (form.spec.vlan !== '' && (!/^\d+$/.test(form.spec.vlan) || form.spec.vlan < 2 || form.spec.vlan > 4095)) {
      errors.push('VLAN值应该是2到4095之间的整数');
    }

    if (form.spec.cidr === '') {
      errors.push('CIDR 不能为空');
    }
    const cidrIPV4RegExp = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/\d{1,2}$/;

    if (form.spec.cidr !== '' && !cidrIPV4RegExp.test(form.spec.cidr)) {
      errors.push('CIDR格式错误');
    }

    const ipv4RegExp = /^(((\d{1,2})|(1\d{2})|(2[0-4]\d)|(25[0-5]))\.){3}((\d{1,2})|(1\d{2})|(2[0-4]\d)|(25[0-5]))$/

    if (!form.spec.gateway && ipv4RegExp.test(form.spec.gateway)) {
      errors.push('Gateway IP 格式错误');
    }

    if (errors.length > 0) {
      set(this, 'errors', errors);

      return false;
    }
    set(this, 'errors', null);

    return true;
  },
});
