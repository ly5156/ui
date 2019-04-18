import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  globalStore: service(),
  scope:       service(),
  vlansubnet:  service(),

  model(params) {
    const cluster = this.modelFor('authenticated.cluster');
    const vlan = params.vlan

    return this.vlansubnet.fetchStaticPods(cluster.id).then((p) => {
      const data = p.body.items.filter((d) => d.spec.vlan.indexOf(vlan) > -1).map((d) => {
        return {
          creationTimestamp: d.metadata.creationTimestamp,
          name:              d.metadata.name,
          displayName:       d.metadata.name,
          namespace:         d.metadata.namespace,
          id:                d.metadata.uid,
          ip:                d.spec.ip,
          mac:               d.spec.mac,
          podId:             d.spec['pod-id'],
          vlan:              d.spec.vlan,
        };
      });

      return {
        cluster,
        staticPods: data,
        rawData:    p.body.items,
      }
    });
  },
  queryParams: { vlan: { refreshModel: true } },
});
