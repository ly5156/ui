import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';
import { get } from '@ember/object';
import { hash } from 'rsvp';

export default Route.extend({
  scope:      service(),
  vlansubnet: service(),

  model() {
    const clusterId = get(this, 'scope.currentCluster.id');
    const vlansubnets = get(this, 'vlansubnet').fetchVlansubnets(clusterId).then((resp) => {
      return  resp.body.items.map((item) => {
        return {
          id:                item.metadata.uid,
          name:              item.metadata.name,
          displayName:        item.metadata.name,
          namespace:         item.metadata.namespace,
          cidr:              item.spec.cidr,
          master:            item.spec.master,
          creationTimestamp: item.metadata.creationTimestamp,
          rawData:           item,
        };
      });
    });

    return hash({
      vlansubnets,
      clusterId,
    });
  },
  actions: {
    error(err) {
      // unsupport vlansubnet
      if ( err && err.status ) {
        this.transitionTo('authenticated.cluster.vlansubnet.unsupport');

        return false;
      } else {
        // Bubble up
        return true;
      }
    },
    refreshModel() {
      this.refresh();
    }
  },
});
