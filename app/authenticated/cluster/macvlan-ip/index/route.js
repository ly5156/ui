import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';
import { hash } from 'rsvp';

export default Route.extend({
  globalStore: service(),
  scope:       service(),
  vlansubnet:  service(),
  prefs:       service(),

  projects:       null,
  projectOptions: null,
  model(params) {
    const clusterId = this.scope.currentCluster.id;
    const subnet = params.subnet;
    const projectId = params.projectId;
    const p = { limit: this.prefs.tablePerPage, };
    let q = [];

    subnet && q.push(encodeURIComponent(`subnet=${ subnet }`));
    projectId && q.push(encodeURIComponent(`field.cattle.io/projectId=${ projectId }`));
    q.length && (p.labelSelector = q.join(','));

    return hash({
      resp:      this.vlansubnet.fetchMacvlanIp(clusterId, p),
      projects:  this.globalStore.findAll('project'),
    }).then((hash) => {
      let data = hash.resp.body.data;

      data.map((item) => {
        item.fullProjectId = `${ clusterId }:${ item.projectId }`
        item.projectName = hash.projects.filterBy('id', item.fullProjectId)[0].name;
        item.workloadName = item.workloadId.split(`-${ item.namespace }-`)[1];
      });
      let projectOptions = hash.projects.map((project) => {
        return {
          value: project.id.substr(clusterId.length + 1),
          label: project.name
        }
      });

      projectOptions.unshift({
        value: '',
        label: '所有项目',
        projectOptions,
      });

      return {
        macvlanIps: {
          data,
          continue: hash.resp.body.metadata.continue
        },
        projectOptions,
      };
    });
  },
  queryParams: {
    subnet:    { refreshModel: true },
    projectId: { refreshModel: true }
  },
});
