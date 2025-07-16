import * as React from 'react';
import {
  K8sResourceCommon,
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
import { 
  Label, 
  Tooltip, 
  Dropdown, 
  DropdownItem, 
  DropdownList, 
  MenuToggle, 
  MenuToggleElement, 
  Stack,
  StackItem,
  Button,
  Grid,
  Gallery,
  GalleryItem,
  Card,
  CardTitle,
  CardBody,
  Flex,
  Divider,
  Modal,
  TextContent,
  CardHeader,
  CardFooter,
  FlexItem,
  Text,
} from '@patternfly/react-core';
import CreateAppDefForm from '../protect/SusanooProtectCreateAppDef';

type SusanooProtectionTableProps = {
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

  const [isHelpModalOpen, setIsHelpModalOpen] = React.useState(false);
  const handleHelpModalToggle = () => {
    setIsHelpModalOpen(!isHelpModalOpen);
  };

  return (
    <>
      <ListPageHeader title="Protection">
        <Button
          variant="primary"
          onClick={handleHelpModalToggle}
        >
          Help
        </Button>
        <Modal
          isOpen={isHelpModalOpen}
          onClose={handleHelpModalToggle}
          title="Protection"
          variant="small"
        >
          This Protection page provides an application-centric overview of all resources associated with an application across one or multiple namespaces, like pods, virtual machines, storage objects, etc.
          <br /><br />
          To get started, you can create an Application Reference by clicking the Create button. This will allow you to select the namespace(s) in which your applications have component(s). The traditional example of a two-tier application could have two namespaces: one for the frontend and one for the backend. 
          <br /> <br />
          Once the Application Reference is created, it will appear in the view with a quick overview of the associated resources and the business continuity status. To configure the protection for the application, you can click on the Actions button to navigate to the details page.
          <br /> <br />
        </Modal>
      </ListPageHeader>
      <ListPageBody>
        <Grid>
          <Gallery hasGutter minWidths={{ default: '430px' }}>            
            <GalleryItem>                
              <Card ouiaId='susanoo-trident-protect-stats'>
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
            {/* <GalleryItem>                
            <Card ouiaId='susanoo-trident-protect-statistics'>
            <CardTitle style={{ textAlign: 'center' } as React.CSSProperties} >Capacity</CardTitle>
              <CardBody style={{ textAlign: 'center' } as React.CSSProperties}>
                <Stack>
                placeholder
                <span>placeholder</span>
                </Stack>
              </CardBody>
            </Card>
            </GalleryItem> */}
          </Gallery>
        </Grid>
      </ListPageBody>
    </>
  );
};

const SusanooProtection = () => {
  const history = useHistory();

  const SusanooTable: React.FC<SusanooProtectionTableProps & { value: string }> = ({ data, unfilteredData, loaded, error, value }) => {

    const columns: TableColumn<CustomizationResource>[] = [
      { title: 'Name', id: 'name' },
      { title: 'Namespaces', id: 'includes' },
      { title: 'Workloads', id: 'workloads' },
      { title: 'Protection State', id: 'state' },
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

      const namespaces = obj.spec?.includedNamespaces?.map((ns: { namespace: string }) => ns.namespace) || [];
    
      const podResource = {
        groupVersionKind: { group: '', version: 'v1', kind: 'Pod' },
        isList: true,
        namespaced: true,
      };
      const [allPods] = useK8sWatchResource<CustomizationResource[]>(podResource);
      const pods = React.useMemo(
        () => allPods.filter((pod) => namespaces.includes(pod.metadata?.namespace || '')),
        [allPods, namespaces]
      );

      const vmResource = {
        groupVersionKind: { group: 'kubevirt.io', version: 'v1', kind: 'VirtualMachine' },
        isList: true,
        namespaced: true,
      };
      const [allVMs] = useK8sWatchResource<CustomizationResource[]>(vmResource);
      const vms = React.useMemo(
        () => allVMs.filter((vm) => namespaces.includes(vm.metadata?.namespace || '')),
        [allVMs, namespaces]
      );

      return (
        <>
          <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
            <ResourceLink groupVersionKind={groupVersionKind} name={obj.metadata?.name} namespace={obj.metadata?.namespace} />
          </TableData>
          <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
          <Stack>
          {namespaces.map((namespace, index) => (
            <StackItem key={`${namespace}-${index}`}><Label color="blue">{namespace}</Label></StackItem>
          ))}
        </Stack>
          </TableData>
          <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
              <Stack>
                <StackItem><Label color="cyan">Pods: {pods.length}</Label></StackItem>
                <StackItem><Label color="purple">VMs: {vms.length}</Label></StackItem>
              </Stack>
          </TableData>          
          <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
            <Tooltip content={getProtectionStateTooltip(obj.status?.protectionState)}>
              <Label color={getStateLabelColor(obj.status?.protectionState)}>
                {obj.status?.protectionState || 'Never ran'}
              </Label>
            </Tooltip>
          </TableData>
          <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs} className="pf-u-text-align-center">
            <Dropdown
              isOpen={isOpen}
              onSelect={(_event, value) => {
                if (value === 'more-details') {
                  history.push({
                    pathname: '/console-protect-details',
                    state: { application: obj.metadata.name, namespaces: namespaces },
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
                <DropdownItem value="more-details" key="more-details">More details</DropdownItem>               
                <DropdownItem value="delete" key="delete" className="pf-m-danger">Delete</DropdownItem>
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
  const [isAppModalOpen, setIsAppModalOpen] = React.useState(false);

  return (
    <>
      <ListPageHeader title="Application References">
      <Button
          variant="primary"
          onClick={() => {
            setIsAppModalOpen(true);
          }}
        >
          Create
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
      {<CreateAppDefForm isOpen={isAppModalOpen} onClose={() => setIsAppModalOpen(false)} />}
    </>
  );
};

const SusanooBasicProtect: React.FC = () => {

    const quickstartResource = {
      groupVersionKind: {
        group: 'console.openshift.io',
        version: 'v1',
        kind: 'ConsoleQuickStart',
      },
        isList: true,
    };

    const [quickstart] = useK8sWatchResource<CustomizationResource[]>(quickstartResource);
    
    const filteredQuickstarts = quickstart.filter(
        (qs) => qs.metadata?.name.includes('netapp-trident-protect')
    );

    return (
      <> 
            <Gallery hasGutter>
                {filteredQuickstarts.map((qs, index) => (
                    <Card key={index} id={qs.metadata.name}>
                        <CardHeader>
                            <CardTitle>{qs.spec.displayName}</CardTitle>
                        </CardHeader>
                        <CardBody>
                            <Text>{qs.spec.description}</Text>
                        </CardBody>
                        <CardFooter>
                            <Flex>
                                <FlexItem>
                                    <a href={`/quickstart?keyword=netapp&quickstart=${qs.metadata.name}`}>Tutorial</a>
                                </FlexItem>
                                <FlexItem>
                                    <a href='#'>Deploy</a>
                                </FlexItem>
                                <FlexItem>
                                    <a href='#'>Git Repo</a>
                                </FlexItem>
                            </Flex>
                        </CardFooter>
                    </Card>
                ))}
            </Gallery>
      </>
    )

};

const SusanooWorkloadDetails = () => {

  interface SecretResource extends K8sResourceCommon {
    data?: {
      [key: string]: string;
    };
  }

  const secretResource = {
      group: '',
      version: 'v1',
      kind: 'Secret',
      name: 'susanoo-activation-key',
      namespace: 'trident',
  };

  const [secret] = useK8sWatchResource<SecretResource>(secretResource);

  const activationKey = secret?.data?.activationKey
    ? atob(secret.data.activationKey)
    : null;

  const [isHelpModalOpen, setIsHelpModalOpen] = React.useState(false);
  const handleHelpModalToggle = () => {
    setIsHelpModalOpen(!isHelpModalOpen);
  };

  if (activationKey !== 'test') {
    return (
      <>
        <ListPageHeader title="Protection">
          <Button
            variant="primary"
            onClick={handleHelpModalToggle}
          >
            Help
          </Button>
          <Modal
            isOpen={isHelpModalOpen}
            onClose={handleHelpModalToggle}
            title="Protection"
            variant="small"
          >
            This Protection page provides an application-centric overview of all resources associated with an application across one or multiple namespaces, like pods, virtual machines, storage objects, etc.
            <br /><br />
            To get started, you can create an Application Reference by clicking the Create button. This will allow you to select the namespace(s) in which your applications have component(s). The traditional example of a two-tier application could have two namespaces: one for the frontend and one for the backend. 
            <br /> <br />
            Once the Application Reference is created, it will appear in the view with a quick overview of the associated resources and the business continuity status. To configure the protection for the application, you can click on the Actions button to navigate to the details page.
            <br /> <br />
          </Modal>
        </ListPageHeader>
        <ListPageBody>
          <Grid hasGutter>
              <Card>
                <CardTitle>BlueXP Backup & Recovery</CardTitle>
                <CardBody>
                  <TextContent>
                    <p>BlueXP Backup & Recovery is a full comprehensive GUI-based user experience simplifying advanced data protection workflows for your critical workloads. With its advanced features, it provides one-click enterprise business continuity capabilities, enabling you to safeguard your application and data complying with your governance and regulations.</p>
                    <p>To get started, add your BlueXP activation key using the Protect wizard within the Susanoo Setup section.</p>
                  </TextContent>
                </CardBody>
              </Card>
              <Card>
                <CardTitle>Trident Protect</CardTitle>
                <CardBody>
                  <TextContent>
                    <p>Trident Protect is the Kubernetes engine for NetApp data protection solution that integrates seamlessly with your Kubernetes environment. It offers features for backup, recovery, and disaster recovery, ensuring the safety and availability of your applications and data using a set of CRDs.</p>
                    <p>To get started, use one of the below quickstart tutorials to protect your application and its data.</p>
                  </TextContent>
                </CardBody>
              </Card>
            <SusanooBasicProtect />
          </Grid>
        </ListPageBody>
      </>
    );
  } else {  
      return (
        <>
          <SusanooProtectStatistics />
          <SusanooProtection />
        </>
      );
  };

};
export default SusanooWorkloadDetails;