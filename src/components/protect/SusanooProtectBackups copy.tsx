import * as React from 'react';
import {
  K8sResourceCommon,
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
import { Button, Label, Tooltip } from '@patternfly/react-core';
import CreateAppDefForm from './SusanooProtectCreateAppDef';
import CreateAppSchedForm from './SusanooProtectCreateAppSched';


// Defining generic table props
type SusanooTableProps = {
  data: K8sResourceKind[];
  unfilteredData: K8sResourceKind[];
  loaded: boolean;
  error?: Error;
};

const SusanooProtectAppBackups = () => {

  const SusanooTable: React.FC<SusanooTableProps & { value: string }> = ({ data, unfilteredData, loaded, error, value}) => {

    const columns: TableColumn<CustomizationResource>[] = [
      {
        title: 'Name',
        id: 'name',
      },
      {
        title: 'Namespace',
        id: 'namespace',
      },
      {
        title: 'Protection State',
        id: 'state',
      },
      {
        title: 'Created',
        id: 'metadata',
      },
      {
        title: 'Included Namespaces',
        id: 'includes',
      },
    ];

    const getStateLabelColor = (phase?: string): 'red' | 'orange' | 'green' => {
      switch (phase) {
          case 'None':
              return 'red';
          case 'Partial':
              return 'orange';
          case 'Full':
              return 'green';
      }
    };

    const getProtectionStateTooltip = (state?: string): string => {
      switch (state) {
        case 'None':
          return 'No protection configured - Application is not protected';
        case 'Partial':
          return 'Partial protection - Some protection features are missing or misconfigured';
        case 'Full':
          return 'Fully protected - All protection features are configured and active';
        default:
          return 'Protection state unknown';
      }
    };

    const SusanooTableRow: React.FC<RowProps<K8sResourceKind>> = ({ obj, activeColumnIDs}) => {
   
      const groupVersionKind = getGroupVersionKindForResource(obj)
      return (
        <>
          <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs} >
            <ResourceLink
              groupVersionKind={groupVersionKind}
              name={obj.metadata?.name}
              namespace={obj.metadata?.namespace}
            />
          </TableData> 
          <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs} >
            {obj.metadata?.namespace}
          </TableData> 
          <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs} >
            <Tooltip content={getProtectionStateTooltip(obj.status?.protectionState)}>
              <Label color={getStateLabelColor(obj.status?.protectionState)} isCompact>
                {obj.status?.protectionState}
              </Label>
            </Tooltip> 
          </TableData>           
          <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
            {obj.metadata.creationTimestamp}
          </TableData>
          <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs} >
            <Label color='blue' isCompact>
              {obj.spec?.includedNamespaces?.map((namespace, index) => (
                <React.Fragment key={`${namespace.namespace}-${index}`}>
                  {namespace.namespace}
                  {index < (obj.spec?.includedNamespaces?.length || 0) - 1 ? ', ' : ''}
                </React.Fragment>
              ))}
            </Label>
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


  const resources = {
    group: 'protect.trident.netapp.io',
    version: 'v1',
    kind: 'Application'
  };

  const backup = '';
  const [data, loaded, error] = useK8sWatchResource<CustomizationResource[]>({
    groupVersionKind: resources,
    isList: true,
    namespaced: true,
  });

  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <>
      <ListPageHeader title="Application References">
      <Button 
          variant="primary"
          onClick={() => {setIsOpen(true);}}
        >
          Add 
        </Button>
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
      <CreateAppDefForm 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );

};

const SusanooSchedule = () => {

  const SusanooTable: React.FC<SusanooTableProps> = ({ data, unfilteredData, loaded, error}) => {

    const columns: TableColumn<K8sResourceCommon>[] = [
      {
        title: 'Name',
        id: 'name',
      },
      {
        title: 'Namespace',
        id: 'namespace',
      },
      {
        title: 'Application',
        id: 'application',
      },
      {
        title: 'AppVault',
        id: 'appvault',
      },
      {
        title: 'Enabled',
        id: 'enabled',
      },
      {
        title: 'Created at',
        id: 'metadata.creationTimestamp',
      },
    ];
  
    const getEnableLabelColor = (enabled?: boolean): 'red' | 'green' => {
      return enabled ? 'green' : 'red';
    };

    const SusanooTableRow: React.FC<RowProps<CustomizationResource>> = ({ obj, activeColumnIDs}) => {
  
      const groupVersionKind = getGroupVersionKindForResource(obj)
      return (
        <>
          <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
            <ResourceLink 
              groupVersionKind={groupVersionKind}
              name={obj.metadata?.name}
              namespace={obj.metadata?.namespace}
            />
          </TableData>
          <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
            {obj.metadata?.namespace}
          </TableData>
          <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
            {obj.spec?.applicationRef}
          </TableData>
          <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
            {obj.spec?.appVaultRef}
          </TableData>
          <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
            <Label color={getEnableLabelColor(obj.spec?.enabled)} isCompact>
              {obj.spec?.enabled ? 'True' : 'False'}
            </Label>
          </TableData>
          <TableData id={columns[5].id} activeColumnIDs={activeColumnIDs}>
            {obj.metadata?.creationTimestamp}
          </TableData>
        </>
      );
    };
  
    return (
      <VirtualizedTable<K8sResourceCommon>
        data={data}
        unfilteredData={unfilteredData}
        loaded={loaded}
        loadError={error}
        columns={columns}
        Row={SusanooTableRow}
      />
    );
  
  };


  // resource to watch
  const resources = {
      group: 'protect.trident.netapp.io',
      version: 'v1',
      kind: 'Schedule',
  };

  const [data, loaded, error] = useK8sWatchResource<CustomizationResource[]>({
    groupVersionKind: resources,
    isList: true,
    namespaced: true,
  });
  
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <ListPageHeader title="Protection Schedules">
        <Button 
          variant="primary"
          onClick={() => {setIsOpen(true);}}
        >
          Add
        </Button>
      </ListPageHeader>
      <ListPageBody>
        <SusanooTable 
          data={data}
          unfilteredData={data}
          loaded={loaded}
          error={error}
        />
      </ListPageBody>
      <CreateAppSchedForm 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );

};

const SusanooProtectLocalBackups = () => {

  const SusanooTable: React.FC<SusanooTableProps & { value: string }> = ({ data, unfilteredData, loaded, error, value}) => {

    const columns: TableColumn<CustomizationResource>[] = [
      {
        title: 'Name',
        id: 'name',
      },
      {
        title: 'Application',
        id: 'application',
      },
      {
        title: 'AppVault',
        id: 'appvault',
      },
      {
        title: 'Created',
        id: 'created',
      },
      {
        title: 'State',
        id: 'state',
      },
      {
        title: 'Snapshots',
        id: 'snapshots',
      },
    ];

    const SusanooTableRow: React.FC<RowProps<CustomizationResource>> = ({ obj, activeColumnIDs}) => {
   
      const groupVersionKind = getGroupVersionKindForResource(obj)
      return (
        <>
          <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs} >
            <ResourceLink
              groupVersionKind={groupVersionKind}
              name={obj.metadata?.name}
              namespace={obj.metadata?.namespace}
            />
          </TableData> 
          <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs} >
            {obj.spec?.applicationRef}
          </TableData> 
          <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs} >
            {obj.spec?.appVaultRef}
          </TableData>   
          <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs} >
            {obj.metadata?.creationTimestamp} 
          </TableData>            
          <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
            {obj.status?.state}
          </TableData>
          <TableData id={columns[5].id} activeColumnIDs={activeColumnIDs} >
              {obj.status?.volumeSnapshots?.map((snapshot) => (
                <React.Fragment key={snapshot.name}>
                  <Label color='blue' isCompact>
                  {snapshot.name}
                  </Label>
                </React.Fragment>
              ))}
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



  const resources = {
    group: 'protect.trident.netapp.io',
    version: 'v1',
    kind: 'Snapshot'
  };

  const backup = '';
  const [data, loaded, error] = useK8sWatchResource<CustomizationResource[]>({
    groupVersionKind: resources,
    isList: true,
    namespaced: true,
  });

  const history = useHistory();

  return (
    <>
      <ListPageHeader title="Snapshots">
        <Button 
          variant="primary"
          onClick={() => {
            history.push('/quickstart?keyword=netapp&quickstart=netapp-trident-protect-backup');
          }}
        >
          Snapshot Now! 
        </Button>
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
  );

};

const SusanooProtectOffloadedBackups = () => {

  const SusanooTable: React.FC<SusanooTableProps & { value: string }> = ({ data, unfilteredData, loaded, error, value}) => {

    const columns: TableColumn<CustomizationResource>[] = [
      {
        title: 'Name',
        id: 'name',
      },
      {
        title: 'Namespace',
        id: 'namespace',
      },
      {
        title: 'State',
        id: 'state',
      },
      {
        title: 'Created',
        id: 'metadata',
      },
      {
        title: 'Completed at',
        id: 'completed',
      },
    ];
  
    const SusanooTableRow: React.FC<RowProps<K8sResourceKind>> = ({ obj, activeColumnIDs}) => {
   
      const groupVersionKind = getGroupVersionKindForResource(obj)
      return (
        <>
          <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs} >
            <ResourceLink
              groupVersionKind={groupVersionKind}
              name={obj.metadata?.name}
              namespace={obj.metadata?.namespace}
            />
          </TableData> 
          <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs} >
            {obj.metadata?.namespace}
          </TableData>
          <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs} >
            {obj.status?.state}
          </TableData>             
          <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
            {obj.metadata.creationTimestamp}
          </TableData>
          <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
            {obj.status?.completionTimestamp}
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

  const resources = {
    group: 'protect.trident.netapp.io',
    version: 'v1',
    kind: 'Backup'
  };

  const backup = '';
  const [data, loaded, error] = useK8sWatchResource<CustomizationResource[]>({
    groupVersionKind: resources,
    isList: true,
    namespaced: true,
  });

  const history = useHistory();

  return (
    <>
      <ListPageHeader title="Backups">
        <Button 
          variant="primary"
          onClick={() => {
            history.push('/quickstart?keyword=netapp&quickstart=netapp-trident-protect-backup');
          }}
        >
          Backup Now! 
        </Button>
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
  );

};

const SusanooProtectBackups = () => {
  
  const history = useHistory();
  return (
    <>
      <ListPageHeader title="Backups managed by Trident Protect">
      <Button 
          variant="primary"
          onClick={() => {
            history.push('/quickstart?keyword=netapp&quickstart=netapp-trident-protect-backup');
          }}
        >
          Backup Example
        </Button>
      </ListPageHeader>
      <SusanooProtectAppBackups />
      <SusanooSchedule />
      <SusanooProtectLocalBackups />
      <SusanooProtectOffloadedBackups />
    </>
  );

}

export default SusanooProtectBackups;