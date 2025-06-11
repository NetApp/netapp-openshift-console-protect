import * as React from 'react';
import {
  K8sResourceKind,
  ListPageBody,
  ListPageFilter,
  ListPageHeader,
  ResourceLink,
  RowFilter,
  RowProps,
  TableColumn,
  TableData,
  VirtualizedTable,
  getGroupVersionKindForResource,
  useK8sWatchResource,
  useListPageFilter,
} from '@openshift-console/dynamic-plugin-sdk';
import { useHistory } from 'react-router-dom';
import { CustomizationResource } from '../../k8s/types';
import { Button, Label, Tooltip, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement, Modal, Grid, Gallery, GalleryItem, Card, CardTitle, CardBody, Flex, Stack, Divider } from '@patternfly/react-core';
import CreateAppDefForm from './SusanooProtectCreateAppDef';
import SusanooProtectSchedDetails from './SusanooProtectSchedDetails';
import SusanooProtectBackupDetails from './SusanooProtectBackupDetails';
import SusanooProtectSnapshotDetails from './SusanooProtectSnapshotDetails';
import SusanooTridentProtectCreateAppVault from './SusanooTridentProtectCreateAppVault';

type SusanooProtectTableProps = {
  data: CustomizationResource[];
  unfilteredData: CustomizationResource[];
  loaded: boolean;
  error?: Error;
};

const SusanooProtectStatistics = () => {

  const appRefResources = {
    group: 'protect.trident.netapp.io',
    version: 'v1',
    kind: 'Application',
  };
  
  const [appRef] = useK8sWatchResource<CustomizationResource[]>({
    groupVersionKind: appRefResources,
    isList: true,
    namespaced: false,
  });

  const snapshotsResources = {
    group: 'protect.trident.netapp.io',
    version: 'v1',
    kind: 'Snapshot',
  };
  
  const [snapshots] = useK8sWatchResource<CustomizationResource[]>({
    groupVersionKind: snapshotsResources,
    isList: true,
    namespaced: false,
  });

  const backupsResources = {
    group: 'protect.trident.netapp.io',
    version: 'v1',
    kind: 'Backup',
  };
  
  const [backups] = useK8sWatchResource<CustomizationResource[]>({
    groupVersionKind: backupsResources,
    isList: true,
    namespaced: false,
  });

  const mirrorsResources = {
    group: 'protect.trident.netapp.io',
    version: 'v1',
    kind: 'AppMirrorRelationship',
  };
  
  const [mirrors] = useK8sWatchResource<CustomizationResource[]>({
    groupVersionKind: mirrorsResources,
    isList: true,
    namespaced: false,
  });

  return (
    <>
      <ListPageHeader title="Protect" />
      <ListPageBody>
        <Grid>
          <Gallery hasGutter minWidths={{ default: '430px' }}>
            <GalleryItem>                
            <Card ouiaId='susanoo-trident-protect-status'>
            <CardTitle style={{ textAlign: 'center' } as React.CSSProperties} >Protections</CardTitle>
              <CardBody style={{ textAlign: 'center' } as React.CSSProperties}>
                <Flex display={{ default: 'inlineFlex' }}>
                    <Stack> 
                      {appRef.length || 0}
                      <span>Applications</span>
                    </Stack>
                    <Divider orientation={{ default: 'vertical' }} />
                    <Stack> 
                      {snapshots.length || 0}
                      <span>Snapshots</span>
                    </Stack>
                    <Divider orientation={{ default: 'vertical' }} />
                    <Stack> 
                      {backups.length || 0}
                      <span>Backups</span>
                    </Stack>
                    <Divider orientation={{ default: 'vertical' }} />
                    <Stack> 
                      {mirrors.length || 0}
                      <span>Mirrors</span>
                    </Stack>
                  </Flex>
              </CardBody>
            </Card>
            </GalleryItem>
            <GalleryItem>                
            <Card ouiaId='susanoo-trident-protect-statistics'>
            <CardTitle style={{ textAlign: 'center' } as React.CSSProperties} >Capacity</CardTitle>
              <CardBody style={{ textAlign: 'center' } as React.CSSProperties}>
                <Stack>
                placeholder
                <span>placeholder</span>
                </Stack>
              </CardBody>
            </Card>
            </GalleryItem>
          </Gallery>
        </Grid>
      </ListPageBody>
    </>
  );
};

const SusanooProtectVault = () => {

  const SusanooTable: React.FC<SusanooProtectTableProps> = ({ data, unfilteredData, loaded, error}) => {

    const columns: TableColumn<CustomizationResource>[] = [
      { title: 'Name', id: 'name', },
      { title: 'Namespace', id: 'namespace', },
      { title: 'Provider', id: 'provider', },
      { title: 'Bucket Name', id: 'bucket', },
      { title: 'Status', id: 'status', },
      { title: 'Created at', id: 'metadata.creationTimestamp',},
    ];
    
    const getStatusLabelColor = (phase?: string): 'red' | 'green' => {
      switch (phase) {
          case 'Error':
              return 'red';
          default:
              return 'green';
      }
    };
  
    const getBucketInfo = (providerConfig: any): string => {
        if (!providerConfig) return '-';
      
        if (providerConfig.s3) {
          return `${providerConfig.s3.bucketName}`;
        }
        if (providerConfig.azure) {
          return `${providerConfig.azure.bucketName})`;
        }
        if (providerConfig.gcp) {
          return `${providerConfig.gcp.bucketName}`;
        }
        return '-';
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
              <Label color="blue" isCompact>
                {obj.spec?.providerType}
                </Label>
          </TableData>
          <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
            <Label color="blue" isCompact>
                {getBucketInfo(obj.spec?.providerConfig)}
            </Label>
          </TableData>
          <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
            <Label color={getStatusLabelColor(obj.status?.state)} isCompact>
              {obj.status?.state}
            </Label>        
          </TableData>
          <TableData id={columns[5].id} activeColumnIDs={activeColumnIDs}>
            {obj.metadata?.creationTimestamp}
          </TableData>
        </>
      );
    };
  
    return (
      <VirtualizedTable<CustomizationResource>
        data={data}
        unfilteredData={unfilteredData}
        loaded={loaded}
        loadError={error}
        columns={columns}
        Row={SusanooTableRow}
      />
    );
  
  };

  const resources = {
      group: 'protect.trident.netapp.io',
      version: 'v1',
      kind: 'AppVault',
  };

  const [data, loaded, error] = useK8sWatchResource<CustomizationResource[]>({
    groupVersionKind: resources,
    isList: true,
    namespaced: true,
  });

  const [isOpen, setIsOpen] = React.useState(false);
    
  return (
    <>
      <ListPageHeader title="Vaults">
        <Button variant="primary" onClick={() => setIsOpen(true)}>
            Actions
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
      <SusanooTridentProtectCreateAppVault 
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
    </>
  );
};

const SusanooProtectApplication = () => {
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
  const [isBackupOpen, setIsBackupOpen] = React.useState(false);
  const [isSnapshotOpen, setIsSnapshotOpen] = React.useState(false);
  const [selectedResource, setSelectedResource] = React.useState<{ namespace: string; name: string } | null>(null);
  const history = useHistory();

  const SusanooTable: React.FC<SusanooProtectTableProps & { value: string }> = ({ data, unfilteredData, loaded, error, value }) => {

    const columns: TableColumn<CustomizationResource>[] = [
      { title: 'Name', id: 'name' },
      { title: 'Namespace', id: 'namespace' },
      { title: 'Protection State', id: 'state' },
      { title: 'Created', id: 'metadata' },
      { title: 'Included Namespaces', id: 'includes' },
      { title: '', id: 'actions' },
    ];

    const getStateLabelColor = (phase?: string): 'red' | 'orange' | 'green' | 'grey' => {
      switch (phase) {
        case 'None':
          return 'red';
        case 'Partial':
          return 'orange';
        case 'Full':
          return 'green';
        default:
          return 'grey';
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
          return 'Application Reference was just configured and never had a job running';
      }
    };

    const SusanooTableRow: React.FC<RowProps<K8sResourceKind>> = ({ obj, activeColumnIDs }) => {

      const [isOpen, setIsOpen] = React.useState(false);
      const groupVersionKind = getGroupVersionKindForResource(obj);

      return (
        <>
          <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
            <ResourceLink groupVersionKind={groupVersionKind} name={obj.metadata?.name} namespace={obj.metadata?.namespace} />
          </TableData>
          <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
            {obj.metadata?.namespace}
          </TableData>
          <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
            <Tooltip content={getProtectionStateTooltip(obj.status?.protectionState)}>
              <Label color={getStateLabelColor(obj.status?.protectionState)} isCompact>
                {obj.status?.protectionState || 'Never ran'}
              </Label>
            </Tooltip>
          </TableData>
          <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
            {obj.metadata.creationTimestamp}
          </TableData>
          <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
            <Label color="blue" isCompact>
              {obj.spec?.includedNamespaces?.map((namespace, index) => (
                <React.Fragment key={`${namespace.namespace}-${index}`}>
                  {namespace.namespace}
                  {index < (obj.spec?.includedNamespaces?.length || 0) - 1 ? ', ' : ''}
                </React.Fragment>
              ))}
            </Label>
          </TableData>
          <TableData id={columns[5].id} activeColumnIDs={activeColumnIDs} className="pf-u-text-align-center">
            <Dropdown
              isOpen={isOpen}
              onSelect={(_event, value) => {
                if (value === 'schedules') {
                  setSelectedResource({ namespace: obj.metadata.namespace, name: obj.metadata.name });
                  setIsDetailsOpen(true);
                  setIsBackupOpen(false);
                  setIsSnapshotOpen(false);
                } else if (value === 'backups') {
                  setSelectedResource({ namespace: obj.metadata.namespace, name: obj.metadata.name });
                  setIsBackupOpen(true);
                  setIsDetailsOpen(false);
                  setIsSnapshotOpen(false);
                } else if (value === 'snapshots') {
                  setSelectedResource({ namespace: obj.metadata.namespace, name: obj.metadata.name });
                  setIsSnapshotOpen(true);
                  setIsBackupOpen(false);
                  setIsDetailsOpen(false);
                } else if (value === 'more-details') {
                  history.push({
                    pathname: '/susanoo-protect-details',
                    state: { application: obj.metadata.name },
                  });
                }
                setIsOpen(false);
              }}
              onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  aria-label="Actions"
                  onClick={() => setIsOpen(!isOpen)}
                  isExpanded={isOpen}
                >
                  Actions
                </MenuToggle>
              )}
            >
              <DropdownList>
                <DropdownItem value="schedules" key="schedules">
                  Schedules
                </DropdownItem>
                <DropdownItem value="snapshots" key="snapshots">
                  Snapshots
                </DropdownItem>                
                <DropdownItem value="backups" key="backups">
                  Backups
                </DropdownItem>
                <DropdownItem value="mirrors" key="mirrors">
                  Mirrors
                </DropdownItem>                
                <DropdownItem value="delete" key="delete" className="pf-m-danger">
                  Delete
                </DropdownItem>
                <DropdownItem value="more-details" key="more-details">
                  More details
                </DropdownItem>
              </DropdownList>
            </Dropdown>
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

  const filters: RowFilter[] = [
      {
        filterGroupName: 'Status',
        type: 'application-status',
        reducer: (application: CustomizationResource) => application.status?.protectionState || 'Unknown',
        filter: (input, application) => {
          if (input.selected?.length) {
            return input.selected.includes(application.status?.phase || 'Unknown');
          }
          return true;
        },
        items: [
          { id: 'None', title: 'None' },
          { id: 'Partial', title: 'Partial' },
          { id: 'Full', title: 'Full' },
        ],
      }
    ];

  const resources = {
    group: 'protect.trident.netapp.io',
    version: 'v1',
    kind: 'Application',
  };

  const backup = '';

  const [application, loaded, error] = useK8sWatchResource<CustomizationResource[]>({
    groupVersionKind: resources,
    isList: true,
    namespaced: true,
  });

  const [data, filteredData, onFilterChange] = useListPageFilter(application, filters);

  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <>
      <ListPageHeader title="Applications">
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Action
        </Button>
      </ListPageHeader>            
      <ListPageBody>
        <ListPageFilter
          data={data}
          loaded={loaded}
          rowFilters={filters}
          onFilterChange={onFilterChange}
        />
        <SusanooTable 
          data={filteredData} 
          unfilteredData={data} 
          loaded={loaded} 
          error={error} 
          value={backup} 
        />
      </ListPageBody>
      <CreateAppDefForm isOpen={isOpen} onClose={() => setIsOpen(false)} />
      {selectedResource && (
        <Modal 
          variant="large"
          title={`Details for Application: ${selectedResource.name}`}
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          actions={[
            <Button 
              aria-label='Close Modal AppRef Details'
              key="close" 
              variant="primary" 
              onClick={() => setIsDetailsOpen(false)}
            >
              Close
            </Button>,
          ]}
        >
          <SusanooProtectSchedDetails application={selectedResource.name} />
        </Modal>
      )}
      {selectedResource && (
        <Modal 
          variant="large"
          title={`Details for Application: ${selectedResource.name}`}
          isOpen={isBackupOpen}
          onClose={() => setIsBackupOpen(false)}
          actions={[
            <Button key="close" variant="primary" onClick={() => setIsBackupOpen(false)}>
              Close
            </Button>,
          ]}
        >
          <SusanooProtectBackupDetails
            application={selectedResource.name}
          />
        </Modal>
      )}
      {selectedResource && (
        <Modal 
          variant="large"
          title={`Details for Application: ${selectedResource.name}`}
          isOpen={isSnapshotOpen}
          onClose={() => setIsSnapshotOpen(false)}
          actions={[
            <Button key="close" variant="primary" onClick={() => setIsSnapshotOpen(false)}>
              Close
            </Button>,
          ]}
        >
          <SusanooProtectSnapshotDetails
            application={selectedResource.name}
          />
        </Modal>
      )}
    </>
  );
};

const SusanooProtectDetails = () => {
  return (
    <div>
      <SusanooProtectStatistics />
      <SusanooProtectVault />
      <SusanooProtectApplication />
    </div>
  );
}
export default SusanooProtectDetails;