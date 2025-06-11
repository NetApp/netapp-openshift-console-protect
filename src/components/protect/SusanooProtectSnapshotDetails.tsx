import * as React from 'react';
import {
  K8sResourceCommon,
  useK8sWatchResource,
  ResourceLink,
  TableData,
  getGroupVersionKindForResource,
  RowProps,
  TableColumn,
  VirtualizedTable,
  ListPageHeader,
  ListPageBody,
} from '@openshift-console/dynamic-plugin-sdk';
import { CustomizationResource } from 'src/k8s/types';
import { Button, Label } from '@patternfly/react-core';
import CreateSnapshotForm from './SusanooProtectCreateSnapshot';

type SusanooProtectAppDetailsProps = {
  application: string;
};

const SusanooProtectSnapDetails: React.FC<SusanooProtectAppDetailsProps> = ({ application }) => {

    const resources = [{
        group: 'protect.trident.netapp.io',
        version: 'v1',
        kind: 'Snapshot',
    }];
  
    const columns: TableColumn<K8sResourceCommon>[] = [
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

        // const [isOpen, setIsOpen] = React.useState(false);

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
    
    type SusanooTableProps = {
        data: CustomizationResource[];
        unfilteredData: CustomizationResource[];
        loaded: boolean;
        error?: Error;
    };

    const CustomizationTable = ({
        data,
        unfilteredData,
        loaded,
        error,
    }: SusanooTableProps) => {
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
  
  
    // const [data, loaded, error] = useK8sWatchResource<CustomizationResource[]>({
    //   groupVersionKind: resources,
    //   isList: true,
    //   namespaced: true,
    // });

    const watches = resources.map(({ group, version, kind }) => {
        const [data, loaded, error] = useK8sWatchResource<CustomizationResource[]>({
          groupVersionKind: { group, version, kind },
          isList: true,
          namespaced: false,
        });
        if (error) {
          console.error('Could not load', kind, error);
        }
        return [data, loaded, error];
      });

    const flatData = watches.map(([list]) => list).flat();
    const loaded = watches.every(([, loaded, error]) => !!(loaded || error));
    
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
          <CustomizationTable 
            data={flatData.filter((schedule) => schedule.spec.applicationRef === application)}
            unfilteredData={flatData}
            loaded={loaded}
          />
        </ListPageBody>
        <CreateSnapshotForm 
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
};

const SusanooProtectSnapshotDetails: React.FC<SusanooProtectAppDetailsProps> = ({ application }) => {
    return (
        <SusanooProtectSnapDetails application={application} />
    );
}

export default SusanooProtectSnapshotDetails;