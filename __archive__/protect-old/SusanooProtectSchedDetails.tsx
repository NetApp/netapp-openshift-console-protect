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
import { Button, Label, Tooltip } from '@patternfly/react-core';
import CreateAppSchedForm from '../protection/SusanooProtectCreateAppSched';

type SusanooProtectAppDetailsProps = {
  application: string;
};

const SusanooProtectSchedDetails: React.FC<SusanooProtectAppDetailsProps> = ({ application }) => {

    const resources = [{
        group: 'protect.trident.netapp.io',
        version: 'v1',
        kind: 'Schedule',
    }];
  
    const columns: TableColumn<K8sResourceCommon>[] = [
      {
        title: 'Name',
        id: 'name',
      },
      {
        title: 'Enabled',
        id: 'enabled',
      },
      {
        title: 'Status',
        id: 'status',
      },
      {
        title: 'Minute',
        id: 'minute',
      },
      {
        title: 'Hour',
        id: 'hour',
      },
      {
        title: 'Day of Week',
        id: 'dayOfweek',
      },
      {
        title: 'Data Mover',
        id: 'datamover',
      },
      {
        title: 'Retention',
        id: 'retention',
      },
    ];
    
    const getEnableLabelColor = (enabled?: boolean): 'red' | 'green' => {
        return enabled ? 'green' : 'red';
      };

    const getStateLabelColor = (phase?: string): 'red' | 'green' => {
      switch (phase) {
        case 'ValidationFailed':
          return 'red';
        default:
          return 'green';
      }
    };
  
    const SusanooTableRow: React.FC<RowProps<CustomizationResource>> = ({ obj, activeColumnIDs}) => {

        const groupVersionKind = getGroupVersionKindForResource(obj)

        // const [isOpen, setIsOpen] = React.useState(false);

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
              <Label color={getEnableLabelColor(obj.spec?.enabled)} isCompact>
                {obj.spec?.enabled ? 'True' : 'False'}
              </Label>
            </TableData>
            <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
              <Tooltip content={(obj.status?.error)}>
                <Label color={getStateLabelColor(obj.status?.state)} isCompact>
                  {obj.status?.state}
                </Label>
              </Tooltip>
            </TableData>            
            <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
              {obj.spec?.minute}
            </TableData>
            <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
              {obj.spec?.hour}
            </TableData>
            <TableData id={columns[5].id} activeColumnIDs={activeColumnIDs}>
              {obj.spec?.dayOfWeek}
            </TableData>
            <TableData id={columns[6].id} activeColumnIDs={activeColumnIDs}>
              {obj.spec?.dataMover}
            </TableData>
            <TableData id={columns[7].id} activeColumnIDs={activeColumnIDs}>
              <Tooltip content="Number of Snapshot retained.">
                <Label color="blue" isCompact >
                  {obj.spec?.snapshotRetention}
                </Label>
              </Tooltip>/
              <Tooltip content="Number of Backups retained.">
                <Label color="blue" isCompact>
                  {obj.spec?.backupRetention}
                </Label>
              </Tooltip>
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
        <ListPageHeader title="Protection Schedules">
          <Button 
            variant="primary"
            onClick={() => {setIsOpen(true);}}
          >
            Add
          </Button>
        </ListPageHeader>
        <ListPageBody>
          <CustomizationTable 
            data={flatData.filter((schedule) => schedule.spec.applicationRef === application)}
            unfilteredData={flatData}
            loaded={loaded}
          />
        </ListPageBody>
        <CreateAppSchedForm 
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </>
    );
};

const SusanooProtectAppDetails: React.FC<SusanooProtectAppDetailsProps> = ({ application }) => {
    return (
        <SusanooProtectSchedDetails application={application} />
    );
}

export default SusanooProtectAppDetails;