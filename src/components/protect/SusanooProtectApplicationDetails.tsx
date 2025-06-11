import * as React from 'react';
import {
  K8sResourceCommon,
  useK8sWatchResource,
  ResourceLink,
  K8sResourceKind,
  TableColumn,
  RowProps,
  getGroupVersionKindForResource,
  TableData,
  VirtualizedTable,
  ListPageHeader,
  ListPageBody,
} from '@openshift-console/dynamic-plugin-sdk';
import { useLocation } from 'react-router';
import { CustomizationResource } from 'src/k8s/types';
import { Button, Label } from '@patternfly/react-core';
import CreateAppSchedForm from './SusanooProtectCreateAppSched';
import CreateSnapshotForm from './SusanooProtectCreateSnapshot';
import CreateBackupForm from './SusanooProtectCreateBackup';

type SusanooProtectDetailsProps = {
    application: string;
  };

const SusanooProtectDetails: React.FC<SusanooProtectDetailsProps> = ({ application }) => {

    const location = useLocation<SusanooProtectDetailsProps>();
    const appref = location.state.application || application;


    type SusanooTableProps = {
      data: K8sResourceKind[];
      unfilteredData: K8sResourceKind[];
      loaded: boolean;
      error?: Error;
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
                data={data.filter((schedule) => schedule.spec.applicationRef === appref)}
                unfilteredData={data.filter((schedule) => schedule.spec.applicationRef === appref)}
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
        
      const [isOpen, setIsOpen] = React.useState(false);
      
      return (
        <>
          <ListPageHeader title="Backups">
          <Button 
            variant="primary"
            onClick={() => {setIsOpen(true);}}
          >
            on-demand backup
          </Button>
          </ListPageHeader>
          <ListPageBody>
            <SusanooTable
              data={data.filter((schedule) => schedule.spec.applicationRef === appref)}
              unfilteredData={data.filter((schedule) => schedule.spec.applicationRef === appref)}
              loaded={loaded}
              error={error}
              value={backup}
            />
          </ListPageBody>
          <CreateBackupForm 
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
    
      const [isOpen, setIsOpen] = React.useState(false);
    
      return (
        <>
          <ListPageHeader title="Snapshots">
          <Button 
            variant="primary"
            onClick={() => {setIsOpen(true);}}
          >
            on-demand snapshot
          </Button>
          </ListPageHeader>
          <ListPageBody>
            <SusanooTable
              data={data.filter((schedule) => schedule.spec.applicationRef === appref)}
              unfilteredData={data.filter((schedule) => schedule.spec.applicationRef === appref)}
              loaded={loaded}
              error={error}
              value={backup}
            />
          </ListPageBody>
          <CreateSnapshotForm 
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
        </>
      );
    
    };
      
    return (
        <>
            <ListPageHeader title={`Application details for: ${appref}`} />
            <SusanooSchedule />
            <SusanooProtectOffloadedBackups />
            <SusanooProtectLocalBackups />
        </>
    );
    
};

export default SusanooProtectDetails;