import * as React from 'react';
import {
  K8sResourceKind,
  ListPageBody,
  ListPageHeader,
  ResourceLink,
  RowProps,
  TableColumn,
  TableData,
  VirtualizedTable,
  getGroupVersionKindForResource,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { useHistory } from 'react-router-dom';
import { CustomizationResource } from '../../k8s/types';
import { loadYAMLContent } from '../../utils/yamlLoader';
import { Button } from '@patternfly/react-core';
import mirrorYAML from '../../assets/YAML/TridentProtectMirror.yaml';

// Defining generic table props
type SusanooTableProps = {
  data: K8sResourceKind[];
  unfilteredData: K8sResourceKind[];
  loaded: boolean;
  error?: Error;
};

const SusanooTable: React.FC<SusanooTableProps & { value: string }> = ({ data, unfilteredData, loaded, error, value}) => {

  const columns: TableColumn<CustomizationResource>[] = [
    {
      title: 'Name',
      id: 'name',
    },
    {
      title: 'Kind',
      id: 'kind',
    },
    {
      title: 'Created at',
      id: 'metadata',
    },
  ];

  const SusanooTableRow: React.FC<RowProps<K8sResourceKind>> = ({ obj, activeColumnIDs}) => {

    const groupVersionKind = getGroupVersionKindForResource(obj)
    return (
      <>
        <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs} >
          <ResourceLink
            groupVersionKind={groupVersionKind}
            name={obj.spec.claimRef.name}
            namespace={obj.spec.claimRef.namespace}
          />
        </TableData> 
        <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs} >
          {obj.kind}
        </TableData>             
        <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
          {obj.metadata.creationTimestamp}
        </TableData>
      </>
    );
  };

  return (
      <VirtualizedTable<K8sResourceKind>
        data={data}
        unfilteredData={unfilteredData}
        loadError={error}
        loaded={loaded}
        columns={columns}
        Row={SusanooTableRow}
      />
  );

};

const SusanooProtectMirrors = () => {

  const resources = {
    group: 'protect.trident.netapp.io',
    version: 'v1',
    kind: 'AppMirrorRelationship'
  };

  const backup = '';
  const [data, loaded, error] = useK8sWatchResource<CustomizationResource[]>({
    groupVersionKind: resources,
    isList: true,
    namespaced: true,
  });

  const [yamlContent, setYamlContent] = React.useState<string>('');
  React.useEffect(() => {
    try {
      const content = loadYAMLContent(mirrorYAML);
      setYamlContent(content);
    } catch (err) {
      console.error('Failed to load YAML:', err);
    }
  }, []);

  const history = useHistory();
  const handleOpenSusanooObjectCreate = (resourceData: string) => {
    history.push({
      pathname: '/netapp-create-object',
      state: { initialResource: {yaml: resourceData} }
    })
  };

  return (
    <>
      <ListPageHeader title="Mirrors managed by Trident Protect">
        {(
          <Button 
            variant='primary'
            onClick={() => handleOpenSusanooObjectCreate(yamlContent)}
          >
            Create Mirror
          </Button>
        )}
      </ListPageHeader>
      <ListPageBody>
        <SusanooTable
          data={data}
          unfilteredData={data}
          loaded={loaded}
          error={error}
          value={backup}
        />
      </ListPageBody>
    </>
  )

};

export default SusanooProtectMirrors;