import * as React from 'react';
import {
  K8sResourceCommon,
  useK8sWatchResource,
  ResourceLink,
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
import { 
  Button,
  Card, 
  CardBody, 
  CardExpandableContent, 
  CardHeader, 
  CardTitle, 
  Dropdown, 
  DropdownItem, 
  Grid, 
  Label,
  LabelGroup,
  Level,
  MenuToggle,
  MenuToggleElement,
  Stack,
  StackItem,
  Tooltip, 
} from '@patternfly/react-core';
import CreateAppSchedForm from '../protect/SusanooProtectCreateAppSched';
import CreateSnapshotForm from '../protect/SusanooProtectCreateSnapshot';
import CreateBackupForm from '../protect/SusanooProtectCreateBackup';

type SusanooProtectionDetailsProps = {
    application: string;
    namespaces: string[];
  };

const SusanooProtectionDetails: React.FC<SusanooProtectionDetailsProps> = ({ application, namespaces }) => {

    const location = useLocation<SusanooProtectionDetailsProps>();
    const appref = location.state.application || application;
    const namespacesref = location.state.namespaces || namespaces;

    type SusanooTableProps = {
      data: CustomizationResource[];
      unfilteredData: CustomizationResource[];
      loaded: boolean;
      error?: Error;
    };

    // refactor the expand all to avoid content pre loaded at expansion
      // const [areAllCardsExpanded, setAreAllCardsExpanded] = React.useState(false);
      // const [isPodsCardExpanded, setIsPodsCardExpanded] = React.useState(false);
      // const [isVMsCardExpanded, setIsVMsCardExpanded] = React.useState(false);
    
      // const toggleAllCards = () => {
      //   const newState = !areAllCardsExpanded;
      //   setAreAllCardsExpanded(newState);
      //   setIsPodsCardExpanded(newState);
      //   setIsVMsCardExpanded(newState);
      // };

    const SusanooProtectionApplication = () => {

      const SusanooTable: React.FC<SusanooTableProps> = ({ data, unfilteredData, loaded, error}) => {
    
        const columns: TableColumn<K8sResourceCommon>[] = [
          { title: 'Name', id: 'name' },
          { title: 'Namespace', id: 'namespace' },
          { title: 'Protection State', id: 'state' },
          { title: 'Included Namespaces', id: 'includes' },
          { title: 'Created', id: 'metadata' },
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
        
        const SusanooTableRow: React.FC<RowProps<CustomizationResource>> = ({ obj, activeColumnIDs}) => {
      
          const groupVersionKind = getGroupVersionKindForResource(obj)

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
                <Stack>
                  {obj.spec?.includedNamespaces?.map((namespace, index) => (
                    <StackItem key={`${namespace.namespace}-${index}`}>
                      <Label color="blue" isCompact>
                        {namespace.namespace}
                      </Label>
                    </StackItem>
                  ))}
                </Stack>
              </TableData>
              <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
                {obj.metadata.creationTimestamp}
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
    
      const includedNamespaces = namespacesref || [];
      const application = {
        groupVersionKind: { group: 'protect.trident.netapp.io', version: 'v1', kind: 'Application' },
        isList: true,
        namespaced: true,
      };
      const [allApplications] = useK8sWatchResource<CustomizationResource[]>(application);
      const applicationReferences = React.useMemo(
        () => allApplications.filter((pod) => includedNamespaces.includes(pod.metadata?.namespace || '')),
        [allApplications, includedNamespaces]
      );     
      
      return (
        <>
            <Card ouiaId='susanoo-protection-pods'>
              <CardTitle id='titleID'>Application Reference</CardTitle>
                <CardBody>
                    <SusanooTable 
                      data={applicationReferences.filter((item) => item.metadata?.name === appref)}
                      unfilteredData={applicationReferences}
                      loaded={true}
                    />
                </CardBody>
            </Card>
        </>
      );
    
    };

    const SusanooProtectionPods = () => {

      const SusanooTable: React.FC<SusanooTableProps> = ({ data, unfilteredData, loaded, error}) => {
    
        const columns: TableColumn<K8sResourceCommon>[] = [
          { title: 'Name', id: 'name',},
          { title: 'Status', id: 'status', },
          { title: 'Namespace', id: 'namespace', },
          { title: 'Deployment', id: 'deployment', },
          { title: 'Start time', id: 'starttime', },
        ];
      
        // const getEnableLabelColor = (enabled?: boolean): 'red' | 'green' => {
        //   return enabled ? 'green' : 'red';
        // };
        
        const SusanooTableRow: React.FC<RowProps<CustomizationResource>> = ({ obj, activeColumnIDs}) => {
      
          const groupVersionKind = getGroupVersionKindForResource(obj)
          console.log('CONSOLELOG: ', groupVersionKind)

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
                {obj.status?.phase}
              </TableData>
              <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
                {obj.metadata?.namespace}
              </TableData>
              <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}> 
              <ResourceLink
                groupVersionKind={{
                  group: obj.metadata?.ownerReferences?.find((ref) =>
                    ref.kind === 'StatefulSet' || ref.kind === 'ReplicaSet' || ref.kind === 'Deployment' || ref.kind === 'DaemonSet' || ref.kind === 'VirtualMachineInstance'
                  )?.apiVersion.split('/')[0] || '', // Extract the group from apiVersion
                  version: obj.metadata?.ownerReferences?.find((ref) =>
                    ref.kind === 'StatefulSet' || ref.kind === 'ReplicaSet' || ref.kind === 'Deployment' || ref.kind === 'DaemonSet' || ref.kind === 'VirtualMachineInstance'
                  )?.apiVersion.split('/')[1] || 'v1', // Extract the version from apiVersion
                  kind: obj.metadata?.ownerReferences?.find((ref) =>
                    ref.kind === 'StatefulSet' || ref.kind === 'ReplicaSet' || ref.kind === 'Deployment' || ref.kind === 'DaemonSet' || ref.kind === 'VirtualMachineInstance'
                  )?.kind || 'Unknown',
                }}
                name={obj.metadata?.ownerReferences?.find((ref) =>
                  ref.kind === 'StatefulSet' || ref.kind === 'ReplicaSet' || ref.kind === 'Deployment' || ref.kind === 'DaemonSet' || ref.kind === 'VirtualMachineInstance'
                )?.name || 'N/A'}
                namespace={obj.metadata?.namespace}
              />
              </TableData>
              <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
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
    
      const includedNamespaces = namespacesref || [];
      const podResource = {
        groupVersionKind: { group: '', version: 'v1', kind: 'Pod' },
        isList: true,
        namespaced: true,
      };
      const [allPods] = useK8sWatchResource<CustomizationResource[]>(podResource);
      const pods = React.useMemo(
        () => allPods.filter((pod) => includedNamespaces.includes(pod.metadata?.namespace || '')),
        [allPods, includedNamespaces]
      );     
    
      const [isPodsCardExpanded, setIsPodsCardExpanded] = React.useState(false);
      const onPodsCardExpand = () => {
        setIsPodsCardExpanded(!isPodsCardExpanded);
      };
      
      return (
        <>
            <Card ouiaId='susanoo-protection-pods' isExpanded={isPodsCardExpanded}>
              <CardHeader 
                onExpand={onPodsCardExpand}
                toggleButtonProps={{
                  'aria-label': 'Expand pods card',
                  'aria-expanded': isPodsCardExpanded,
                  'aria-labelledby': 'titleID toggle-button',
                  id: 'toggle-button',
                }}
                >
                  {isPodsCardExpanded && <CardTitle id='titleID'>Pods</CardTitle>}
                  {!isPodsCardExpanded && (
                    <Level hasGutter>
                      <CardTitle id='titleID'>Pods</CardTitle>
                      <LabelGroup>
                        <Label color="cyan">
                          Pods: {pods.length || 0}
                        </Label>
                        <Label color="blue">
                          Namespaces: {includedNamespaces.length || 0}
                        </Label>
                      </LabelGroup>
                    </Level>
                  )}
              </CardHeader>
              <CardExpandableContent>
                <CardBody>
                    <SusanooTable 
                      data={pods}
                      unfilteredData={pods}
                      loaded={true}
                    />
                </CardBody>
              </CardExpandableContent>
            </Card>
        </>
      );
    
    };

    const SusanooProtectionVMs = () => {

      const SusanooTable: React.FC<SusanooTableProps> = ({ data, unfilteredData, loaded, error}) => {
    
        const columns: TableColumn<K8sResourceCommon>[] = [
          { title: 'Name', id: 'name',},
          { title: 'Status', id: 'status', },
          { title: 'Namespace', id: 'namespace', },
          { title: 'Start time', id: 'starttime', },
        ];
      
        // const getEnableLabelColor = (enabled?: boolean): 'red' | 'green' => {
        //   return enabled ? 'green' : 'red';
        // };
        
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
                {obj.status?.printableStatus}
              </TableData>
              <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs}>
                {obj.metadata?.namespace}
              </TableData>
              <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
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
    
      const includedNamespaces = namespacesref || [];
      const vmResource = {
        groupVersionKind: { group: 'kubevirt.io', version: 'v1', kind: 'VirtualMachine' },
        isList: true,
        namespaced: true,
      };
      const [allVMs] = useK8sWatchResource<CustomizationResource[]>(vmResource);
      const vms = React.useMemo(
        () => allVMs.filter((pod) => includedNamespaces.includes(pod.metadata?.namespace || '')),
        [allVMs, includedNamespaces]
      );
      
      const namespacesWithVMs = React.useMemo(
        () => includedNamespaces.filter((namespace) => vms.some((vm) => vm.metadata?.namespace === namespace)),
        [vms, includedNamespaces]
      );
      
      const [isVMsCardExpanded, setIsVMsCardExpanded] = React.useState(false);
      const onVMsCardExpand = () => {
        setIsVMsCardExpanded(!isVMsCardExpanded);
      };
      
      return (
        <>
            <Card ouiaId='susanoo-protection-vms' isExpanded={isVMsCardExpanded}>
              <CardHeader 
                onExpand={onVMsCardExpand}
                toggleButtonProps={{
                  'aria-label': 'Expand pods card',
                  'aria-expanded': isVMsCardExpanded,
                  'aria-labelledby': 'titleID toggle-button',
                  id: 'toggle-button',
                }}
                >
                  {isVMsCardExpanded && <CardTitle id='titleID'>Virtual Machines</CardTitle>}
                  {!isVMsCardExpanded && (
                    <Level hasGutter>
                      <CardTitle id='titleID'>Virtual Machines</CardTitle>
                      <LabelGroup>
                        <Label color="cyan">
                          VMs: {vms.length || 0}
                        </Label>
                        <Label color="blue">
                          Namespaces: {namespacesWithVMs.length || 0}
                        </Label>
                      </LabelGroup>
                    </Level>
                  )}
              </CardHeader>
              <CardExpandableContent>
                <CardBody>
                    <SusanooTable 
                      data={vms}
                      unfilteredData={vms}
                      loaded={true}
                    />
                </CardBody>
              </CardExpandableContent>
            </Card>
        </>
      );
    
    };

    const SusanooProtectionPVCs = () => {

      const SusanooTable: React.FC<SusanooTableProps> = ({ data, unfilteredData, loaded, error}) => {
    
        const columns: TableColumn<CustomizationResource>[] = [
          { title: 'Name', id: 'name' },
          { title: 'Status', id: 'status' },
          { title: 'Namespace', id: 'namespace' },
          { title: 'Access Mode', id: 'accessmode' },
          { title: 'Exported to', id: 'exportedto' },
          { title: '', id: 'actions' },
        ];
      
        const getPhaseLabelColor = (phase?: string): 'green' | 'blue' | 'grey' => {
          switch (phase) {
              case 'Bound':
                  return 'green';
              case 'Released':
                  return 'blue';
              default:
                  return 'grey';
          }
        };
        const getOCPAILabelColor = (phase?: string): 'green' | 'grey' => {
          switch (phase) {
              case 'true':
                  return 'green';
              default:
                  return 'grey';
          }
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
              <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs} >
                <Label color={getPhaseLabelColor(obj.status?.phase)}>
                  {obj.status?.phase}
                </Label>
              </TableData>           
              <TableData id={columns[2].id} activeColumnIDs={activeColumnIDs} >
                <ResourceLink
                  groupVersionKind={{
                    group: '',
                    version: 'v1',
                    kind: 'Project'
                  }}
                  name={obj.metadata?.namespace}
                  namespace={obj.metadata?.namespace}
                  />
              </TableData>             
              <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs}>
                {obj.spec?.accessModes}
              </TableData>
              <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
                <Label color={getOCPAILabelColor(obj.metadata?.labels?.['opendatahub.io/dashboard'])} >
                  {obj.metadata?.labels?.['opendatahub.io/dashboard'] ? 'OpenShift AI' : 'None'}
                </Label>
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
    
      const includedNamespaces = namespacesref || [];
      const vmResource = {
        groupVersionKind: { group: '', version: 'v1', kind: 'PersistentVolumeClaim' },
        isList: true,
        namespaced: true,
      };
      const [allPVCs] = useK8sWatchResource<CustomizationResource[]>(vmResource);
      const pvcs = React.useMemo(
        () => allPVCs.filter((pod) => includedNamespaces.includes(pod.metadata?.namespace || '')),
        [allPVCs, includedNamespaces]
      );
      
      const pvcWithPCs = React.useMemo(
        () => pvcs.filter((pv) => includedNamespaces.includes(pv.metadata?.namespace || '') && pv.spec?.volumeName),
        [pvcs, includedNamespaces]
      );
      
      const [isVMsCardExpanded, setIsVMsCardExpanded] = React.useState(false);
      const onVMsCardExpand = () => {
        setIsVMsCardExpanded(!isVMsCardExpanded);
      };
      
      return (
        <>
            <Card ouiaId='susanoo-Protection-storage' isExpanded={isVMsCardExpanded}>
              <CardHeader 
                onExpand={onVMsCardExpand}
                toggleButtonProps={{
                  'aria-label': 'Expand pods card',
                  'aria-expanded': isVMsCardExpanded,
                  'aria-labelledby': 'titleID toggle-button',
                  id: 'toggle-button',
                }}
                >
                  {isVMsCardExpanded && <CardTitle id='titleID'>PersistentVolumeClaims</CardTitle>}
                  {!isVMsCardExpanded && (
                    <Level hasGutter>
                      <CardTitle id='titleID'>PersistentVolumeClaims</CardTitle>
                      <LabelGroup>
                        <Label color="cyan">
                          PVCs: {pvcs.length || 0}
                        </Label>
                        <Label color="blue">
                          PVs: {pvcWithPCs.length || 0}
                        </Label>
                      </LabelGroup>
                    </Level>
                  )}
              </CardHeader>
              <CardExpandableContent>
                <CardBody>
                    <SusanooTable 
                      data={pvcs}
                      unfilteredData={pvcs}
                      loaded={true}
                    />
                </CardBody>
              </CardExpandableContent>
            </Card>
        </>
      );
    
    };

    const SusanooSchedule = () => {

        const SusanooTable: React.FC<SusanooTableProps> = ({ data, unfilteredData, loaded, error}) => {
      
          const columns: TableColumn<CustomizationResource>[] = [
            { title: 'Name', id: 'name',},
            { title: 'Namespace', id: 'namespace', },
            { title: 'Application', id: 'application', },
            { title: 'AppVault', id: 'appvault', },
            { title: 'Enabled', id: 'enabled', },
            { title: 'Created at', id: 'metadata.creationTimestamp', },
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
        
        // const [isOpen, setIsOpen] = React.useState(false);
      
        const [isSchedCardExpanded, setIsSchedCardExpanded] = React.useState(false);
        const onSchedCardExpand = () => {
          setIsSchedCardExpanded(!isSchedCardExpanded);
        };  

        const [isScheduleCardOpen, setIsScheduleOpen] = React.useState(false);
        const scheduleCardAction = (
          <Button variant='primary' onClick={() => setIsScheduleOpen(true)}>Create</Button>
        );

        return (
          <>
            <Card ouiaId='susanoo-Protection-schedules' isExpanded={isSchedCardExpanded}>
              <CardHeader 
                actions={{ actions: scheduleCardAction}}
                onExpand={onSchedCardExpand}
                toggleButtonProps={{
                  'aria-label': 'Expand schedules card',
                  'aria-expanded': isSchedCardExpanded,
                  'aria-labelledby': 'titleID toggle-button',
                  id: 'toggle-button',
                }}
                >
                  {isSchedCardExpanded && <CardTitle id='titleID'>Protection Schedules</CardTitle>}
                  {!isSchedCardExpanded && (
                    <Level hasGutter>
                      <CardTitle id='titleID'>Protection Schedules</CardTitle>
                      <LabelGroup>
                        <Label color="blue">
                          Schedules: {data.filter((schedule) => schedule.spec.applicationRef === appref).length || 0}
                        </Label>
                      </LabelGroup>
                    </Level>
                  )}
              </CardHeader>
              <CardExpandableContent>
                <CardBody>
                  <SusanooTable 
                    data={data.filter((schedule) => schedule.spec.applicationRef === appref)}
                    unfilteredData={data.filter((schedule) => schedule.spec.applicationRef === appref)}
                    loaded={loaded}
                    error={error}
                  />
              </CardBody>
              </CardExpandableContent>
            </Card>
            <CreateAppSchedForm isOpen={isScheduleCardOpen} onClose={() => setIsScheduleOpen(false)} />
          </>
        );
      
    };

    const SusanooProtectLocalBackups = () => {
    
      const SusanooTable: React.FC<SusanooTableProps & { value: string }> = ({ data, unfilteredData, loaded, error, value}) => {
    
        const columns: TableColumn<CustomizationResource>[] = [
          { title: 'Name', id: 'name', },
          { title: 'Application', id: 'application', },
          { title: 'Vault', id: 'appvault', },
          { title: 'Created', id: 'created', },
          { title: 'State', id: 'state', },
          { title: 'Snapshots', id: 'snapshots', },
          { title: '', id: 'actions', },
        ];
    
        const SusanooTableRow: React.FC<RowProps<CustomizationResource>> = ({ obj, activeColumnIDs}) => {
          
          const [isActionsOpen, setIsActionsOpen] = React.useState(false);
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
              <TableData id={columns[6].id} activeColumnIDs={activeColumnIDs} >
                <Dropdown
                  isOpen={isActionsOpen}
                  onSelect={(_event, value) => {
                    if (value === 'restore') {
                    } else if (value === 'delete') {
                    }
                    setIsActionsOpen(false);
                  }}
                  onOpenChange={(isActionsOpen: boolean) => setIsActionsOpen(isActionsOpen)}
                  toggle={(toggleRef: React.RefObject<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      aria-label="Actions"
                      onClick={() => setIsActionsOpen(!isActionsOpen)}
                    >
                      Actions
                    </MenuToggle> 
                  )}
                >
                  <DropdownItem key="restore" component="button">Restore</DropdownItem>
                  <DropdownItem key="delete" component="button" className="pf-m-danger">Delete</DropdownItem>
                </Dropdown>
              </TableData>
            </>
          );
        };
      
        return (
            <VirtualizedTable<CustomizationResource>
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
    
      // const [isOpen, setIsOpen] = React.useState(false);
    
      const [isLBCardExpanded, setIsLBCardExpanded] = React.useState(false);
      const onLBCardExpand = () => {
        setIsLBCardExpanded(!isLBCardExpanded);
      };

      const [isLocalCardOpen, setIsLocalOpen] = React.useState(false);
      const localCardAction = (
        <Button variant='primary' onClick={() => setIsLocalOpen(true)}>Create</Button>
      );


      return (
        <>
          <Card ouiaId='susanoo-Protection-local-backups' isExpanded={isLBCardExpanded}>
            <CardHeader
              actions={{ actions: localCardAction}}
              onExpand={onLBCardExpand}
              toggleButtonProps={{
                'aria-label': 'Expand local backups card',
                'aria-expanded': isLBCardExpanded,
                'aria-labelledby': 'titleID toggle-button',
                id: 'toggle-button',
              }}
            >
              {isLBCardExpanded && <CardTitle id='titleID'>Local Backups</CardTitle>}
              {!isLBCardExpanded && (
                <Level hasGutter>
                  <CardTitle id='titleID'>Local Backups</CardTitle>
                  <LabelGroup>
                    <Label color="blue">
                      Backups: {data.filter((schedule) => schedule.spec.applicationRef === appref).length || 0}
                    </Label>
                  </LabelGroup>
                </Level>
              )}
            </CardHeader>
            <CardExpandableContent>
              <CardBody>
                <SusanooTable
                  data={data.filter((schedule) => schedule.spec.applicationRef === appref)}
                  unfilteredData={data.filter((schedule) => schedule.spec.applicationRef === appref)}
                  loaded={loaded}
                  error={error}
                  value={backup}
                />
            </CardBody>
            </CardExpandableContent>
            <CreateSnapshotForm isOpen={isLocalCardOpen} onClose={() => setIsLocalOpen(false)} />
          </Card>
        </>
      );
    
    };

    const SusanooProtectOffloadedBackups = () => {
    
      const SusanooTable: React.FC<SusanooTableProps & { value: string }> = ({ data, unfilteredData, loaded, error, value}) => {
    
        const columns: TableColumn<CustomizationResource>[] = [
          { title: 'Name', id: 'name', },
          { title: 'Namespace', id: 'namespace', },
          { title: 'Vault', id: 'vault' },
          { title: 'State', id: 'state', },
          { title: 'Created', id: 'created', },
          { title: 'Completed', id: 'completed',},
          { title: '', id: 'actions', },
        ];
      
        const SusanooTableRow: React.FC<RowProps<CustomizationResource>> = ({ obj, activeColumnIDs}) => {
       
          const [isActionsOpen, setIsActionsOpen] = React.useState(false);
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
                {obj.spec?.appVaultRef}
              </TableData>
              <TableData id={columns[3].id} activeColumnIDs={activeColumnIDs} >
                {obj.status?.state}
              </TableData>             
              <TableData id={columns[4].id} activeColumnIDs={activeColumnIDs}>
                {obj.metadata.creationTimestamp}
              </TableData>
              <TableData id={columns[5].id} activeColumnIDs={activeColumnIDs}>
                {obj.status?.completionTimestamp}
              </TableData>
              <TableData id={columns[6].id} activeColumnIDs={activeColumnIDs} >
                <Dropdown
                  isOpen={isActionsOpen}
                  onSelect={(_event, value) => {
                    if (value === 'restore') {
                    } else if (value === 'delete') {
                    }
                    setIsActionsOpen(false);
                  }}
                  onOpenChange={(isActionsOpen: boolean) => setIsActionsOpen(isActionsOpen)}
                  toggle={(toggleRef: React.RefObject<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      aria-label="Actions"
                      onClick={() => setIsActionsOpen(!isActionsOpen)}
                    >
                      Actions
                    </MenuToggle> 
                  )}
                >
                  <DropdownItem key="restore" component="button">Restore</DropdownItem>
                  <DropdownItem key="delete" component="button" className="pf-m-danger">Delete</DropdownItem>
                </Dropdown>
              </TableData>
            </>
          );
        };
      
        return (
            <VirtualizedTable<CustomizationResource>
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
        
      // const [isOpen, setIsOpen] = React.useState(false);

      const [isOBCardExpanded, setIsOBCardExpanded] = React.useState(false);
      const onOBCardExpand = () => {
        setIsOBCardExpanded(!isOBCardExpanded);
      };

      const [isRemoteCardOpen, setIsRemoteOpen] = React.useState(false);
      const remoteCardAction = (
        <Button variant='primary' onClick={() => setIsRemoteOpen(true)}>Create</Button>
      );
      
      return (
        <>
          <Card ouiaId='susanoo-Protection-offloaded-backups' isExpanded={isOBCardExpanded}>
            <CardHeader
              actions={{ actions: remoteCardAction}}
              onExpand={onOBCardExpand}
              toggleButtonProps={{
                'aria-label': 'Expand offloaded backups card',
                'aria-expanded': isOBCardExpanded,
                'aria-labelledby': 'titleID toggle-button',
                id: 'toggle-button',
              }}
            >
              {isOBCardExpanded && <CardTitle id='titleID'>Offloaded Backups</CardTitle>}
              {!isOBCardExpanded && (
                <Level hasGutter>
                  <CardTitle id='titleID'>Offloaded Backups</CardTitle>
                  <LabelGroup>
                    <Label color="blue">
                      Backups: {data.filter((schedule) => schedule.spec.applicationRef === appref).length || 0}
                    </Label>
                  </LabelGroup>
                </Level>
              )}
            </CardHeader>
            <CardExpandableContent>
            <CardTitle id='titleID'>Offloaded Backups</CardTitle>
              <CardBody>        
                <SusanooTable
                  data={data.filter((schedule) => schedule.spec.applicationRef === appref)}
                  unfilteredData={data.filter((schedule) => schedule.spec.applicationRef === appref)}
                  loaded={loaded}
                  error={error}
                  value={backup}
                />
              </CardBody>
            </CardExpandableContent>
            <CreateBackupForm isOpen={isRemoteCardOpen} onClose={() => setIsRemoteOpen(false)} />
          </Card>            
        </>
      );
    
    };
      
    return (
        <>
            <ListPageHeader title={`Protection details for '${appref}'`} />
            <ListPageBody>
              <Grid hasGutter>
                <SusanooProtectionApplication />
                <SusanooProtectionPods />
                <SusanooProtectionVMs />
                <SusanooProtectionPVCs />
              </Grid>
            </ListPageBody>
            <ListPageHeader title='Business Continuity' />
            <ListPageBody>
              <Grid hasGutter>
                <SusanooSchedule />
                <SusanooProtectLocalBackups />
                <SusanooProtectOffloadedBackups />
              </Grid>
            </ListPageBody>
        </>
    );
    
};

export default SusanooProtectionDetails;