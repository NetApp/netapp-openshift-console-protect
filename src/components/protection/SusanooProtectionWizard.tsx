import * as React from 'react';
import {
  k8sCreate,
  useK8sWatchResource,
  K8sResourceCommon,
} from '@openshift-console/dynamic-plugin-sdk';
import { 
  Button,
  Grid,
  GridItem,
  Card,
  CardBody,
  Modal,
  TextContent,
  Text,
  Wizard,
  WizardHeader,
  WizardStep,
  TextList,
  TextListItem,
  TextListVariants,
  TextVariants,
  Form,
  FormGroup,
  TextInput,
  Switch,
  Split,
  SplitItem,
  FormSelect,
  FormSelectOption,
} from '@patternfly/react-core';
import { PlusCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';

type SusanooProtectionWizardProps = {
  isOpen: boolean;
  onClose: () => void;
};

const SusanooProtectionWizard: React.FC<SusanooProtectionWizardProps> = ({ isOpen, onClose }) => {
  // Application Reference form state
  const [wizardAppName, setWizardAppName] = React.useState('');
  const [wizardNamespace, setWizardNamespace] = React.useState('');
  const [wizardSkipVmFreeze, setWizardSkipVmFreeze] = React.useState(true);
  const [wizardIncludedNamespaces, setWizardIncludedNamespaces] = React.useState(['']);
  const [wizardNamespaceFilter, setWizardNamespaceFilter] = React.useState<string[]>(['']);
  const [wizardLabelSelectors, setWizardLabelSelectors] = React.useState<{[key: string]: string}[]>([{}]);

  // Schedule form state
  const [wizardScheduleName, setWizardScheduleName] = React.useState('');
  const [wizardScheduleNamespace, setWizardScheduleNamespace] = React.useState('');
  const [wizardDataMover, setWizardDataMover] = React.useState('none');
  const [wizardBackupStrategy, setWizardBackupStrategy] = React.useState('');
  const [wizardApplicationRef, setWizardApplicationRef] = React.useState('');
  const [wizardAppVaultRef, setWizardAppVaultRef] = React.useState('');
  const [wizardBackupRetention, setWizardBackupRetention] = React.useState('15');
  const [wizardSnapshotRetention, setWizardSnapshotRetention] = React.useState('15');
  const [wizardGranularity, setWizardGranularity] = React.useState('Hourly');
  const [wizardDayOfMonth, setWizardDayOfMonth] = React.useState('1');
  const [wizardDayOfWeek, setWizardDayOfWeek] = React.useState('1');
  const [wizardHour, setWizardHour] = React.useState('0');
  const [wizardMinute, setWizardMinute] = React.useState('0');

  // Local backup form state
  const [wizardBackupName, setWizardBackupName] = React.useState('');
  const [wizardBackupNamespace, setWizardBackupNamespace] = React.useState('');
  const [wizardBackupDataMover, setWizardBackupDataMover] = React.useState('Kopia');
  const [wizardBackupApplicationRef, setWizardBackupApplicationRef] = React.useState('');
  const [wizardBackupAppVaultRef, setWizardBackupAppVaultRef] = React.useState('');

  // Snapshot form state
  const [wizardSnapshotName, setWizardSnapshotName] = React.useState('');
  const [wizardSnapshotNamespace, setWizardSnapshotNamespace] = React.useState('');
  const [wizardReclaimPolicy, setWizardReclaimPolicy] = React.useState('Delete');
  const [wizardSnapshotApplicationRef, setWizardSnapshotApplicationRef] = React.useState('');
  const [wizardSnapshotAppVaultRef, setWizardSnapshotAppVaultRef] = React.useState('');

  // Watch resources
  const namespaceResource = {
    kind: 'Namespace',
    isList: true,
  };
  const [namespaces, namespacesLoaded] = useK8sWatchResource<K8sResourceCommon[]>(namespaceResource);
  const namespaceOptions = React.useMemo(() => 
    Array.isArray(namespaces) ? namespaces.map(ns => ns.metadata?.name || '') : [], 
    [namespaces]
  );

  const applicationResource = {
    group: 'protect.trident.netapp.io',
    version: 'v1',
    kind: 'Application',
  };
  const [applications, applicationsLoaded] = useK8sWatchResource<K8sResourceCommon[]>({ 
    groupVersionKind: applicationResource,
    isList: true,
    namespaced: true,
  });

  const appVaultResource = {
    group: 'protect.trident.netapp.io',
    version: 'v1',
    kind: 'AppVault',
  };
  const [appVaults, appVaultsLoaded] = useK8sWatchResource<K8sResourceCommon[]>({ 
    groupVersionKind: appVaultResource,
    isList: true,
    namespaced: true,
  });

  const applicationOptions = React.useMemo(() => 
    Array.isArray(applications) ? applications.map(app => ({
      name: app.metadata?.name || '',
      namespace: app.metadata?.namespace || ''
    })) : [], 
    [applications]
  );

  const appVaultOptions = React.useMemo(() => 
    Array.isArray(appVaults) ? appVaults.map(av => ({
      name: av.metadata?.name || '',
      namespace: av.metadata?.namespace || ''
    })) : [], 
    [appVaults]
  );

  // Helper functions
  const getFilteredOptions = (filter: string) => {
    return namespaceOptions.filter(namespace => 
      namespace.toLowerCase().includes(filter.toLowerCase())
    );
  };

  const addWizardNamespace = () => {
    setWizardIncludedNamespaces([...wizardIncludedNamespaces, '']);
    setWizardNamespaceFilter([...wizardNamespaceFilter, '']);
    setWizardLabelSelectors([...wizardLabelSelectors, {}]);
  };

  const removeWizardNamespace = (index: number) => {
    setWizardIncludedNamespaces(wizardIncludedNamespaces.filter((_, i) => i !== index));
    setWizardNamespaceFilter(wizardNamespaceFilter.filter((_, i) => i !== index));
    setWizardLabelSelectors(wizardLabelSelectors.filter((_, i) => i !== index));
  };

  const handleWizardNamespaceChange = (selectedNamespace: string) => {
    setWizardNamespace(selectedNamespace);
    setWizardIncludedNamespaces([selectedNamespace, ...wizardIncludedNamespaces.slice(1)]);
  };

  const addLabelSelector = (namespaceIndex: number) => {
    const updated = [...wizardLabelSelectors];
    const labelKey = `label-${Date.now()}`;
    updated[namespaceIndex] = { ...updated[namespaceIndex], [labelKey]: '' };
    setWizardLabelSelectors(updated);
  };

  const removeLabelSelector = (namespaceIndex: number, labelKey: string) => {
    const updated = [...wizardLabelSelectors];
    delete updated[namespaceIndex][labelKey];
    setWizardLabelSelectors(updated);
  };

  const updateLabelSelector = (namespaceIndex: number, oldKey: string, newKey: string, value: string) => {
    const updated = [...wizardLabelSelectors];
    if (oldKey !== newKey && oldKey !== '') {
      delete updated[namespaceIndex][oldKey];
    }
    updated[namespaceIndex][newKey] = value;
    setWizardLabelSelectors(updated);
  };

  const handleBackupStrategyChange = (strategy: string) => {
    setWizardBackupStrategy(strategy);
    
    switch (strategy) {
      case 'hourly-incremental':
        setWizardDataMover('none');
        setWizardSnapshotRetention('12');
        setWizardBackupRetention('0');
        setWizardGranularity('Hourly');
        setWizardMinute('0');
        break;
      case 'daily-incremental':
        setWizardDataMover('none');
        setWizardSnapshotRetention('7');
        setWizardBackupRetention('0');
        setWizardGranularity('Daily');
        setWizardHour('0');
        setWizardMinute('15');
        break;
      case 'weekly-full':
        setWizardDataMover('none');
        setWizardSnapshotRetention('4');
        setWizardBackupRetention('0');
        setWizardGranularity('Weekly');
        setWizardDayOfWeek('5'); // Friday
        setWizardHour('20');
        setWizardMinute('15');
        break;
      case 'monthly-full':
        setWizardDataMover('none');
        setWizardSnapshotRetention('12');
        setWizardBackupRetention('0');
        setWizardGranularity('Monthly');
        setWizardDayOfMonth('1');
        setWizardHour('0');
        setWizardMinute('15');
        break;
      case 'daily-incremental-remote':
        setWizardDataMover('Kopia');
        setWizardSnapshotRetention('0');
        setWizardBackupRetention('7');
        setWizardGranularity('Daily');
        setWizardHour('0');
        setWizardMinute('0');
        break;
      case 'weekly-full-remote':
        setWizardDataMover('Kopia');
        setWizardSnapshotRetention('0');
        setWizardBackupRetention('4');
        setWizardGranularity('Weekly');
        setWizardDayOfWeek('5'); // Friday
        setWizardHour('20');
        setWizardMinute('30');
        break;
      case 'monthly-full-remote':
        setWizardDataMover('Kopia');
        setWizardSnapshotRetention('0');
        setWizardBackupRetention('12');
        setWizardGranularity('Monthly');
        setWizardDayOfMonth('1');
        setWizardHour('0');
        setWizardMinute('45');
        break;
      case 'custom':
        // For custom strategy, don't set any defaults - let user configure everything
        break;
      default:
        break;
    }
  };

  // Submit handlers
  const handleApplicationSubmit = async () => {
    if (!wizardAppName || !wizardNamespace || !wizardIncludedNamespaces.some(ns => ns.trim())) {
      console.error('Required application fields are missing');
      return;
    }

    const application = {
      apiVersion: 'protect.trident.netapp.io/v1',
      kind: 'Application',
      metadata: {
        name: wizardAppName,
        namespace: wizardNamespace,
        annotations: {
          'protect.trident.netapp.io/skip-vm-freeze': wizardSkipVmFreeze.toString()
        }
      },
      spec: {
        includedNamespaces: wizardIncludedNamespaces
          .filter(ns => ns.trim())
          .map((ns, index) => {
            const labelSelector = wizardLabelSelectors[index] || {};
            const matchLabels = Object.keys(labelSelector).reduce((acc, key) => {
              if (key && labelSelector[key]) {
                acc[key] = labelSelector[key];
              }
              return acc;
            }, {} as {[key: string]: string});

            return {
              namespace: ns,
              labelSelector: Object.keys(matchLabels).length > 0 ? { matchLabels } : {}
            };
          })
      }
    };

    try {
      await k8sCreate({
        model: {
          apiGroup: 'protect.trident.netapp.io',
          apiVersion: 'v1',
          kind: 'Application',
          abbr: 'APP',
          label: 'Application',
          labelPlural: 'Applications',
          plural: 'applications',
          namespaced: true,
          crd: true
        },
        data: application,
        ns: wizardNamespace
      });
      console.log('Application created successfully');
      // Reset form
      setWizardAppName('');
      setWizardNamespace('');
      setWizardSkipVmFreeze(true);
      setWizardIncludedNamespaces(['']);
      setWizardNamespaceFilter(['']);
      setWizardLabelSelectors([{}]);
    } catch (err) {
      console.error('Failed to create Application:', err);
    }
  };

  const handleScheduleSubmit = async () => {
    if (!wizardScheduleName || !wizardScheduleNamespace || !wizardApplicationRef || !wizardAppVaultRef) {
      console.error('Required schedule fields are missing');
      return;
    }

    const schedule: any = {
      apiVersion: 'protect.trident.netapp.io/v1',
      kind: 'Schedule',
      metadata: {
        name: wizardScheduleName,
        namespace: wizardScheduleNamespace,
      },
      spec: {
        applicationRef: wizardApplicationRef,
        appVaultRef: wizardAppVaultRef,
        backupRetention: wizardBackupRetention,
        snapshotRetention: wizardSnapshotRetention,
        granularity: wizardGranularity,
        dayOfMonth: wizardDayOfMonth,
        dayOfWeek: wizardDayOfWeek,
        hour: wizardHour,
        minute: wizardMinute,
      }
    };

    // Add full backup annotation for weekly and monthly strategies
    if (wizardBackupStrategy === 'weekly-full' || wizardBackupStrategy === 'monthly-full' || wizardBackupStrategy === 'weekly-full-remote' || wizardBackupStrategy === 'monthly-full-remote') {
      schedule.metadata.annotations = {
        'protect.trident.netapp.io/full-backup-rule': 'always'
      };
    }

    if (wizardDataMover !== 'none') {
      schedule.spec.dataMover = wizardDataMover;
    }

    try {
      await k8sCreate({
        model: {
          apiGroup: 'protect.trident.netapp.io',
          apiVersion: 'v1',
          kind: 'Schedule',
          abbr: 'SCH',
          label: 'Schedule',
          labelPlural: 'Schedules',
          plural: 'schedules',
          namespaced: true,
          crd: true
        },
        data: schedule,
        ns: wizardScheduleNamespace
      });
      console.log('Schedule created successfully');
      // Reset form
      setWizardScheduleName('');
      setWizardScheduleNamespace('');
      setWizardDataMover('none');
      setWizardBackupStrategy('');
      setWizardApplicationRef('');
      setWizardAppVaultRef('');
      setWizardBackupRetention('15');
      setWizardSnapshotRetention('15');
      setWizardGranularity('Hourly');
      setWizardDayOfMonth('1');
      setWizardDayOfWeek('1');
      setWizardHour('0');
      setWizardMinute('0');
    } catch (err) {
      console.error('Failed to create Schedule:', err);
    }
  };

  const handleBackupSubmit = async () => {
    if (!wizardBackupName || !wizardBackupNamespace || !wizardBackupApplicationRef || !wizardBackupAppVaultRef) {
      console.error('Required backup fields are missing');
      return;
    }

    const backup: any = {
      apiVersion: 'protect.trident.netapp.io/v1',
      kind: 'Backup',
      metadata: {
        name: wizardBackupName,
        namespace: wizardBackupNamespace,
      },
      spec: {
        applicationRef: wizardBackupApplicationRef,
        appVaultRef: wizardBackupAppVaultRef,
        dataMover: wizardBackupDataMover,
      }
    };

    try {
      await k8sCreate({
        model: {
          apiGroup: 'protect.trident.netapp.io',
          apiVersion: 'v1',
          kind: 'Backup',
          abbr: 'BKP',
          label: 'Backup',
          labelPlural: 'Backups',
          plural: 'backups',
          namespaced: true,
          crd: true
        },
        data: backup,
        ns: wizardBackupNamespace
      });
      console.log('On-Demand Backup created successfully');
      // Reset form
      setWizardBackupName('');
      setWizardBackupNamespace('');
      setWizardBackupDataMover('Kopia');
      setWizardBackupApplicationRef('');
      setWizardBackupAppVaultRef('');
    } catch (err) {
      console.error('Failed to create on-demand Backup:', err);
    }
  };

  const handleSnapshotSubmit = async () => {
    if (!wizardSnapshotName || !wizardSnapshotNamespace || !wizardSnapshotApplicationRef || !wizardSnapshotAppVaultRef) {
      console.error('Required snapshot fields are missing');
      return;
    }

    const snapshot: any = {
      apiVersion: 'protect.trident.netapp.io/v1',
      kind: 'Snapshot',
      metadata: {
        name: wizardSnapshotName,
        namespace: wizardSnapshotNamespace,
      },
      spec: {
        applicationRef: wizardSnapshotApplicationRef,
        appVaultRef: wizardSnapshotAppVaultRef,
        reclaimPolicy: wizardReclaimPolicy,
      }
    };

    try {
      await k8sCreate({
        model: {
          apiGroup: 'protect.trident.netapp.io',
          apiVersion: 'v1',
          kind: 'Snapshot',
          abbr: 'SNP',
          label: 'Snapshot',
          labelPlural: 'Snapshots',
          plural: 'snapshots',
          namespaced: true,
          crd: true
        },
        data: snapshot,
        ns: wizardSnapshotNamespace
      });
      console.log('Snapshot created successfully');
      // Reset form
      setWizardSnapshotName('');
      setWizardSnapshotNamespace('');
      setWizardReclaimPolicy('Delete');
      setWizardSnapshotApplicationRef('');
      setWizardSnapshotAppVaultRef('');
    } catch (err) {
      console.error('Failed to create Snapshot:', err);
    }
  };

  return (
    <Modal 
      aria-label='Application Protection Helper'
      variant="large"
      isOpen={isOpen}
      onClose={onClose}
      hasNoBodyWrapper
      showClose={false}
    >
      <Wizard
        onClose={onClose}
        header={
          <WizardHeader
            title="Application Protection Helper"
            titleId="app-protection-wizard"
            onClose={onClose}
            description="This wizard will guide you through the complete process of setting up protection for your applications, including creating an Application Reference, configuring backup schedule strategies, and triggering on-demand local and remote backups."
            aria-describedby='app-protection-wizard'
            aria-label='Application Protection Helper Wizard'
          />
        }
      >
        <WizardStep name="Introduction" id="app-protection-intro">
          <TextContent>
            <Text component={TextVariants.h1}>Application Protection Overview</Text>
            <Text component={TextVariants.p}>
              NetApp Trident Protect provides comprehensive data protection for your Kubernetes applications. 
              This wizard will help you set up complete automated protection coverage in the following steps:
            </Text>
            <TextList component={TextListVariants.ol}>
              <TextListItem>Create an Application Reference to define your application scope</TextListItem>
              <TextListItem>Configure protection schedule strategies for automated snapshots and backups</TextListItem>
              <TextListItem>Trigger an on-demand local application protection</TextListItem>
              <TextListItem>Trigger an on-demand backup with external data copy for disaster recovery</TextListItem>
            </TextList>
            <Text component={TextVariants.p}>
              Each step is independent of the previous one to create a comprehensive protection strategy for your applications.
            </Text>
            <Text component={TextVariants.h2}>Prerequisites</Text>
            <TextList>
              <TextListItem>Trident Protect must be installed and configured</TextListItem>
              <TextListItem>Application Vault must be configured for remote backups</TextListItem>
              <TextListItem>Sufficient storage capacity for local snapshots and backups</TextListItem>
              <TextListItem>Network connectivity to remote storage endpoints</TextListItem>
            </TextList>
          </TextContent>
        </WizardStep>

        <WizardStep name="Application Reference" id="app-ref-step">
          <Grid hasGutter>
            <GridItem span={6}>
              <TextContent>
                <Text component={TextVariants.h1}>Application Protection Reference</Text>
                <Text component={TextVariants.p}>
                  An Application Reference defines the scope of your application by specifying which namespace(s) 
                  contain(s) your application component(s). This allows Trident Protect to understand what resources 
                  belong to your application and include(s) them in protection jobs.
                </Text>
                <Text component={TextVariants.h2}>Configuration</Text>
                <TextList>
                  <TextListItem><strong>Application Protection Name:</strong> Choose a descriptive name for your application's protection reference</TextListItem>
                  <TextListItem><strong>Namespaces:</strong> Select all namespaces that contain your application components</TextListItem>
                  <TextListItem><strong>Labels:</strong> Optionally add labels for better organization and filtering</TextListItem>
                </TextList>
              </TextContent>
            </GridItem>
            <GridItem span={6}>
              <Card>
                <CardBody>
                  <Form>

                    <FormGroup label="Select the Application Namespace" isRequired fieldId="wizard-app-namespace">
                      <FormSelect
                        id="wizard-namespace-select"
                        value={wizardNamespace}
                        onChange={(event) => handleWizardNamespaceChange(event.currentTarget.value)}
                        isDisabled={!namespacesLoaded}
                      >
                        <FormSelectOption key="placeholder" value="" label="Select namespace" isPlaceholder />
                        {getFilteredOptions('').map((namespace) => (
                          <FormSelectOption key={namespace} value={namespace} label={namespace} />
                        ))}
                      </FormSelect>
                    </FormGroup>

                    <FormGroup label="Application Protection Name" isRequired fieldId="wizard-app-name">
                      <TextInput
                        id="wizard-app-name"
                        value={wizardAppName}
                        onChange={(_event, val) => setWizardAppName(val)}
                        isRequired
                      />
                    </FormGroup>

                    <FormGroup label="Skip VM Freeze (default for containerized application)" fieldId="wizard-skip-vm-freeze">
                      <Switch
                        id="wizard-skip-vm-freeze"
                        label="Skip VM Freeze"
                        isChecked={wizardSkipVmFreeze}
                        onChange={(_event, checked) => setWizardSkipVmFreeze(checked)}
                      />
                    </FormGroup>

                    <FormGroup label="Included Additional Namespaces" isRequired>
                      <Split hasGutter style={{ marginBottom: '0.5rem' }}>
                        <SplitItem isFilled>
                          <TextInput
                            id="wizard-main-namespace"
                            value={wizardNamespace}
                            readOnly={true}
                          />
                        </SplitItem>
                      </Split>
                      
                      {/* Label selectors for main namespace */}
                      {wizardNamespace && (
                        <div style={{ marginLeft: '1rem', marginBottom: '1rem' }}>
                          <Text component={TextVariants.small} style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            Label Selectors for {wizardNamespace}:
                          </Text>
                          {Object.entries(wizardLabelSelectors[0] || {}).map(([key, value], labelIndex) => (
                            <Split key={`main-${labelIndex}`} hasGutter style={{ marginBottom: '0.25rem' }}>
                              <SplitItem>
                                <TextInput
                                  placeholder="Label key"
                                  value={key.startsWith('label-') ? '' : key}
                                  onChange={(_event, newKey) => updateLabelSelector(0, key, newKey, value)}
                                  style={{ width: '120px' }}
                                />
                              </SplitItem>
                              <SplitItem>
                                <TextInput
                                  placeholder="Label value"
                                  value={value}
                                  onChange={(_event, newValue) => updateLabelSelector(0, key, key, newValue)}
                                  style={{ width: '120px' }}
                                />
                              </SplitItem>
                              <SplitItem>
                                <Button
                                  variant="plain"
                                  onClick={() => removeLabelSelector(0, key)}
                                  icon={<MinusCircleIcon />}
                                />
                              </SplitItem>
                            </Split>
                          ))}
                          <Button
                            variant="link"
                            icon={<PlusCircleIcon />}
                            onClick={() => addLabelSelector(0)}
                            style={{ padding: 0, fontSize: '12px' }}
                          >
                            Add label selector
                          </Button>
                        </div>
                      )}

                      {wizardIncludedNamespaces.slice(1).map((ns, index) => (
                        <div key={index + 1} style={{ marginBottom: '1rem' }}>
                          <Split hasGutter style={{ marginBottom: '0.5rem' }}>
                            <SplitItem isFilled>
                              <FormSelect
                                id={`wizard-namespace-select-${index + 1}`}
                                value={ns}
                                onChange={(event) => {
                                  const updated = [...wizardIncludedNamespaces];
                                  updated[index + 1] = event.currentTarget.value;
                                  setWizardIncludedNamespaces(updated);
                                }}
                                isDisabled={!namespacesLoaded}
                              >
                                <FormSelectOption key="placeholder" value="" label="Select namespace" isPlaceholder />
                                {getFilteredOptions(wizardNamespaceFilter[index + 1]).map((namespace) => (
                                  <FormSelectOption key={namespace} value={namespace} label={namespace} />
                                ))}
                              </FormSelect>
                            </SplitItem>
                            <SplitItem>
                              <Button
                                variant="plain"
                                onClick={() => removeWizardNamespace(index + 1)}
                                isDisabled={wizardIncludedNamespaces.length === 2}
                              >
                                <MinusCircleIcon />
                              </Button>
                            </SplitItem>
                          </Split>
                          
                          {/* Label selectors for additional namespaces */}
                          {ns && (
                            <div style={{ marginLeft: '1rem' }}>
                              <Text component={TextVariants.small} style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                Label Selectors for {ns}:
                              </Text>
                              {Object.entries(wizardLabelSelectors[index + 1] || {}).map(([key, value], labelIndex) => (
                                <Split key={`ns-${index + 1}-${labelIndex}`} hasGutter style={{ marginBottom: '0.25rem' }}>
                                  <SplitItem>
                                    <TextInput
                                      placeholder="Label key"
                                      value={key.startsWith('label-') ? '' : key}
                                      onChange={(_event, newKey) => updateLabelSelector(index + 1, key, newKey, value)}
                                      style={{ width: '120px' }}
                                    />
                                  </SplitItem>
                                  <SplitItem>
                                    <TextInput
                                      placeholder="Label value"
                                      value={value}
                                      onChange={(_event, newValue) => updateLabelSelector(index + 1, key, key, newValue)}
                                      style={{ width: '120px' }}
                                    />
                                  </SplitItem>
                                  <SplitItem>
                                    <Button
                                      variant="plain"
                                      onClick={() => removeLabelSelector(index + 1, key)}
                                      icon={<MinusCircleIcon />}
                                    />
                                  </SplitItem>
                                </Split>
                              ))}
                              <Button
                                variant="link"
                                icon={<PlusCircleIcon />}
                                onClick={() => addLabelSelector(index + 1)}
                                style={{ padding: 0, fontSize: '12px' }}
                              >
                                Add label selector
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="link"
                        icon={<PlusCircleIcon />}
                        onClick={addWizardNamespace}
                        style={{ padding: 0 }}
                      >
                        Add namespace
                      </Button>
                    </FormGroup>

                    <Button 
                      variant="primary" 
                      onClick={handleApplicationSubmit}
                      isDisabled={!wizardAppName || !wizardNamespace || !wizardIncludedNamespaces.some(ns => ns.trim())}
                      style={{ marginTop: '1rem' }}
                    >
                      Create Application Reference
                    </Button>
                  </Form>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </WizardStep>

        <WizardStep name="Schedule Strategy" id="schedule-step">
          <Grid hasGutter>
            <GridItem span={6}>
              <TextContent>
                <Text component={TextVariants.h1}>Protection Schedule Strategy</Text>
                <Text component={TextVariants.p}>
                  Protection schedule strategies provide pre-configured backup patterns that automatically set optimal 
                  timing, retention, and frequency settings.
                </Text>
                <Text component={TextVariants.h2}>Available Strategies</Text>
                <TextList>
                  <TextListItem><strong>Hourly or Daily local incremental:</strong> Creates snapshots every hour or day with typical retention for rapid recovery from recent changes</TextListItem>
                  <TextListItem><strong>Weekly or Monthly local full:</strong> Creates weekly or monthly backups with a typical retention for longer-term protection</TextListItem>
                  <TextListItem><strong>Daily incremental remote:</strong> Creates daily remote backups using Kopia data mover for offsite protection</TextListItem>
                  <TextListItem><strong>Weekly or Monthly remote full:</strong> Creates comprehensive weekly or monthly remote backups for disaster recovery</TextListItem>
                  <TextListItem><strong>Custom:</strong> Allows you to configure all parameters including data mover, retention policies, schedule frequency, and timing to meet specific requirements</TextListItem>
                </TextList>
                <Text component={TextVariants.p}>
                  Each strategy automatically configures snapshot retention, backup frequency, and optimal scheduling 
                  times while allowing you to customize specific timing details to fit your operational requirements.
                </Text>
                <Text component={TextVariants.p}>
                  For a customized schedule, open the Application Reference details and configure a granular schedule 
                  with specific retention and timing settings.
                </Text>
              </TextContent>
            </GridItem>
            <GridItem span={6}>
              <Card>
                <CardBody>
                  <Form>
                    <FormGroup label="Backup Strategies" isRequired fieldId="wizard-backup-strategy">
                      <FormSelect
                        id="wizard-backup-strategy-select"
                        value={wizardBackupStrategy}
                        onChange={(event) => handleBackupStrategyChange(event.currentTarget.value)}
                      >
                        <FormSelectOption key="placeholder" value="" label="Select backup strategy" isPlaceholder />
                        <FormSelectOption value="hourly-incremental" label="Hourly incremental local backup" />
                        <FormSelectOption value="daily-incremental" label="Daily incremental local backup" />
                        <FormSelectOption value="weekly-full" label="Weekly full local backup" />
                        <FormSelectOption value="monthly-full" label="Monthly full local backup" />
                        <FormSelectOption value="daily-incremental-remote" label="Daily incremental remote backup" />
                        <FormSelectOption value="weekly-full-remote" label="Weekly full remote backup" />
                        <FormSelectOption value="monthly-full-remote" label="Monthly full remote backup" />
                        <FormSelectOption value="custom" label="Custom (configure all parameters)" />
                      </FormSelect>
                    </FormGroup>

                    <FormGroup label="Application Reference" isRequired fieldId="wizard-application-ref">
                      <FormSelect
                        id="wizard-application-ref-select"
                        value={wizardApplicationRef}
                        onChange={(event) => {
                          const selectedApp = applicationOptions.find(app => app.name === event.currentTarget.value);
                          if (selectedApp) {
                            setWizardApplicationRef(selectedApp.name);
                            setWizardScheduleNamespace(selectedApp.namespace);
                          }
                        }}
                        isDisabled={!applicationsLoaded}
                      >
                        <FormSelectOption key="placeholder" value="" label="Select application reference" isPlaceholder />
                        {applicationOptions.map((app) => (
                          <FormSelectOption key={app.name} value={app.name} label={`${app.name} (${app.namespace})`} />
                        ))}
                      </FormSelect>
                    </FormGroup>

                    <FormGroup label="Schedule Name" isRequired fieldId="wizard-schedule-name">
                      <TextInput
                        id="wizard-schedule-name"
                        value={wizardScheduleName}
                        onChange={(_event, val) => setWizardScheduleName(val)}
                        isRequired
                      />
                    </FormGroup>

                    <FormGroup label="AppVault Reference" isRequired fieldId="wizard-appvault-ref">
                      <FormSelect
                        id="wizard-appvault-ref-select"
                        value={wizardAppVaultRef}
                        onChange={(event) => setWizardAppVaultRef(event.currentTarget.value)}
                        isDisabled={!appVaultsLoaded}
                      >
                        <FormSelectOption key="placeholder" value="" label="Select AppVault" isPlaceholder />
                        {appVaultOptions.map((appVault) => (
                          <FormSelectOption key={appVault.name} value={appVault.name} label={`${appVault.name} (${appVault.namespace})`} />
                        ))}
                      </FormSelect>
                    </FormGroup>

                    {wizardBackupStrategy === 'custom' && (
                      <FormGroup label="Data Mover" fieldId="wizard-data-mover">
                        <FormSelect
                          id="wizard-data-mover-select"
                          value={wizardDataMover}
                          onChange={(event) => setWizardDataMover(event.currentTarget.value)}
                        >
                          <FormSelectOption value="none" label="None (Local only)" />
                          <FormSelectOption value="Kopia" label="Kopia" />
                          <FormSelectOption value="Restic" label="Restic" />
                        </FormSelect>
                      </FormGroup>
                    )}

                    <FormGroup label="Backup Retention (days)" isRequired fieldId="wizard-backup-retention">
                      <TextInput
                        id="wizard-backup-retention"
                        value={wizardBackupRetention}
                        onChange={(_event, val) => setWizardBackupRetention(val)}
                        isRequired
                        isDisabled={wizardBackupStrategy !== '' && !wizardBackupStrategy.includes('-remote') && wizardBackupStrategy !== 'custom'}
                      />
                    </FormGroup>

                    <FormGroup label="Snapshot Retention (days)" isRequired fieldId="wizard-snapshot-retention">
                      <TextInput
                        id="wizard-snapshot-retention"
                        value={wizardSnapshotRetention}
                        onChange={(_event, val) => setWizardSnapshotRetention(val)}
                        isRequired
                        isDisabled={wizardBackupStrategy.includes('-remote') && wizardBackupStrategy !== 'custom'}
                      />
                    </FormGroup>

                    <FormGroup label="Schedule Frequency" isRequired fieldId="wizard-granularity">
                      <FormSelect
                        id="wizard-granularity-select"
                        value={wizardGranularity}
                        onChange={(event) => setWizardGranularity(event.currentTarget.value)}
                        isDisabled={wizardBackupStrategy !== '' && wizardBackupStrategy !== 'custom'}
                      >
                        <FormSelectOption value="Hourly" label="Hourly" />
                        <FormSelectOption value="Daily" label="Daily" />
                        <FormSelectOption value="Weekly" label="Weekly" />
                        <FormSelectOption value="Monthly" label="Monthly" />
                      </FormSelect>
                    </FormGroup>

                    {wizardGranularity === 'Monthly' && (
                      <FormGroup label="Day of Month" fieldId="wizard-day-of-month">
                        <FormSelect
                          id="wizard-day-of-month-select"
                          value={wizardDayOfMonth}
                          onChange={(event) => setWizardDayOfMonth(event.currentTarget.value)}
                        >
                          {[...Array(28)].map((_, i) => (
                            <FormSelectOption key={i + 1} value={(i + 1).toString()} label={(i + 1).toString()} />
                          ))}
                        </FormSelect>
                      </FormGroup>
                    )}

                    {wizardGranularity === 'Weekly' && (
                      <FormGroup label="Day of Week" fieldId="wizard-day-of-week">
                        <FormSelect
                          id="wizard-day-of-week-select"
                          value={wizardDayOfWeek}
                          onChange={(event) => setWizardDayOfWeek(event.currentTarget.value)}
                        >
                          <FormSelectOption value="0" label="Sunday" />
                          <FormSelectOption value="1" label="Monday" />
                          <FormSelectOption value="2" label="Tuesday" />
                          <FormSelectOption value="3" label="Wednesday" />
                          <FormSelectOption value="4" label="Thursday" />
                          <FormSelectOption value="5" label="Friday" />
                          <FormSelectOption value="6" label="Saturday" />
                        </FormSelect>
                      </FormGroup>
                    )}

                    {(wizardGranularity === 'Daily' || wizardGranularity === 'Weekly' || wizardGranularity === 'Monthly') && (
                      <FormGroup label="Hour (24-hour format)" fieldId="wizard-hour">
                        <FormSelect
                          id="wizard-hour-select"
                          value={wizardHour}
                          onChange={(event) => setWizardHour(event.currentTarget.value)}
                        >
                          {[...Array(24)].map((_, i) => (
                            <FormSelectOption key={i} value={i.toString()} label={`${i.toString().padStart(2, '0')}:00`} />
                          ))}
                        </FormSelect>
                      </FormGroup>
                    )}

                    <FormGroup label="Minute" fieldId="wizard-minute">
                      <FormSelect
                        id="wizard-minute-select"
                        value={wizardMinute}
                        onChange={(event) => setWizardMinute(event.currentTarget.value)}
                      >
                        <FormSelectOption value="0" label="00" />
                        <FormSelectOption value="15" label="15" />
                        <FormSelectOption value="30" label="30" />
                        <FormSelectOption value="45" label="45" />
                      </FormSelect>
                    </FormGroup>

                    <Button 
                      variant="primary" 
                      onClick={handleScheduleSubmit}
                      isDisabled={!wizardScheduleName || !wizardScheduleNamespace || !wizardApplicationRef || !wizardAppVaultRef || !wizardBackupStrategy}
                      style={{ marginTop: '1rem' }}
                    >
                      Create Protection Schedule
                    </Button>
                  </Form>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </WizardStep>

        <WizardStep name="Trigger Local Backup" id="local-backup-step">
          <Grid hasGutter>
            <GridItem span={6}>
              <TextContent>
                <Text component={TextVariants.h1}>Setup Local Backup Policy</Text>
                <Text component={TextVariants.p}>
                  Local backups provide fast recovery capabilities by storing backup data within the same cluster 
                  or storage system. They offer quick restore times for common recovery scenarios.
                </Text>
                <Text component={TextVariants.h2}>Local Backup Benefits</Text>
                <TextList>
                  <TextListItem>Fast backup and restore operations</TextListItem>
                  <TextListItem>Minimal network overhead</TextListItem>
                  <TextListItem>Ideal for development and testing environments</TextListItem>
                  <TextListItem>Quick recovery from user errors or corruption</TextListItem>
                </TextList>
                <Text component={TextVariants.h2}>Configuration Options</Text>
                <TextList>
                  <TextListItem><strong>Retention Policy:</strong> How long to keep local backups</TextListItem>
                  <TextListItem><strong>Storage Class:</strong> Which storage class to use for backup data</TextListItem>
                  <TextListItem><strong>Compression:</strong> Enable compression to save storage space</TextListItem>
                  <TextListItem><strong>Encryption:</strong> Enable encryption for sensitive data</TextListItem>
                </TextList>
              </TextContent>
            </GridItem>
            <GridItem span={6}>
              <Card>
                <CardBody>
                  <Form>
                    <FormGroup label="Backup Name" isRequired fieldId="wizard-backup-name">
                      <TextInput
                        id="wizard-backup-name"
                        value={wizardBackupName}
                        onChange={(_event, val) => setWizardBackupName(val)}
                        isRequired
                      />
                    </FormGroup>

                    <FormGroup label="Data Mover" fieldId="wizard-backup-data-mover">
                      <FormSelect
                        id="wizard-backup-data-mover-select"
                        value={wizardBackupDataMover}
                        onChange={(event) => setWizardBackupDataMover(event.currentTarget.value)}
                      >
                        <FormSelectOption value="Kopia" label="Kopia" />
                        <FormSelectOption value="Restic" label="Restic" />
                      </FormSelect>
                    </FormGroup>

                    <FormGroup label="Application Reference" isRequired fieldId="wizard-backup-application-ref">
                      <FormSelect
                        id="wizard-backup-application-ref-select"
                        value={wizardBackupApplicationRef}
                        onChange={(event) => {
                          const selectedApp = applicationOptions.find(app => app.name === event.currentTarget.value);
                          if (selectedApp) {
                            setWizardBackupApplicationRef(selectedApp.name);
                            setWizardBackupNamespace(selectedApp.namespace);
                          }
                        }}
                        isDisabled={!applicationsLoaded}
                      >
                        <FormSelectOption key="placeholder" value="" label="Select application reference" isPlaceholder />
                        {applicationOptions.map((app) => (
                          <FormSelectOption key={app.name} value={app.name} label={`${app.name} (${app.namespace})`} />
                        ))}
                      </FormSelect>
                    </FormGroup>

                    <FormGroup label="AppVault Reference" isRequired fieldId="wizard-backup-appvault-ref">
                      <FormSelect
                        id="wizard-backup-appvault-ref-select"
                        value={wizardBackupAppVaultRef}
                        onChange={(event) => setWizardBackupAppVaultRef(event.currentTarget.value)}
                        isDisabled={!appVaultsLoaded}
                      >
                        <FormSelectOption key="placeholder" value="" label="Select AppVault" isPlaceholder />
                        {appVaultOptions.map((appVault) => (
                          <FormSelectOption key={appVault.name} value={appVault.name} label={`${appVault.name} (${appVault.namespace})`} />
                        ))}
                      </FormSelect>
                    </FormGroup>

                    <Button 
                      variant="primary" 
                      onClick={handleBackupSubmit}
                      isDisabled={!wizardBackupName || !wizardBackupNamespace || !wizardBackupApplicationRef || !wizardBackupAppVaultRef}
                      style={{ marginTop: '1rem' }}
                    >
                      Create Local Backup
                    </Button>
                  </Form>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </WizardStep>

        <WizardStep name="Trigger Remote Backup" id="remote-backup-step">
          <Grid hasGutter>
            <GridItem span={6}>
              <TextContent>
                <Text component={TextVariants.h1}>Configure Remote Backup</Text>
                <Text component={TextVariants.p}>
                  Remote backups provide disaster recovery capabilities by storing backup data in a separate 
                  location or cloud storage. This protects against site-wide failures and provides geographic separation.
                </Text>
                <Text component={TextVariants.h2}>Remote Backup Benefits</Text>
                <TextList>
                  <TextListItem>Protection against site-wide disasters</TextListItem>
                  <TextListItem>Compliance with geographic separation requirements</TextListItem>
                  <TextListItem>Long-term archival capabilities</TextListItem>
                  <TextListItem>Cross-cluster and cross-cloud mobility</TextListItem>
                </TextList>
                <Text component={TextVariants.h2}>Prerequisites</Text>
                <TextList>
                  <TextListItem>Application Vault must be configured with S3-compatible storage</TextListItem>
                  <TextListItem>Network connectivity to the remote storage endpoint</TextListItem>
                  <TextListItem>Sufficient bandwidth for backup data transfer</TextListItem>
                  <TextListItem>Appropriate credentials and permissions</TextListItem>
                </TextList>
                <Text component={TextVariants.h2}>Configuration</Text>
                <TextList>
                  <TextListItem><strong>Destination:</strong> Select the Application Vault for remote storage</TextListItem>
                  <TextListItem><strong>Transfer Schedule:</strong> When to transfer backups to remote storage</TextListItem>
                  <TextListItem><strong>Retention:</strong> How long to keep remote backups</TextListItem>
                  <TextListItem><strong>Bandwidth Limits:</strong> Optional limits to control network usage</TextListItem>
                </TextList>
              </TextContent>
            </GridItem>
            <GridItem span={6}>
              <Card>
                <CardBody>
                  <Form>
                    <FormGroup label="Snapshot Name" isRequired fieldId="wizard-snapshot-name">
                      <TextInput
                        id="wizard-snapshot-name"
                        value={wizardSnapshotName}
                        onChange={(_event, val) => setWizardSnapshotName(val)}
                        isRequired
                      />
                    </FormGroup>

                    <FormGroup label="Reclaim Policy" fieldId="wizard-reclaim-policy">
                      <FormSelect
                        id="wizard-reclaim-policy-select"
                        value={wizardReclaimPolicy}
                        onChange={(event) => setWizardReclaimPolicy(event.currentTarget.value)}
                      >
                        <FormSelectOption value="Delete" label="Delete" />
                        <FormSelectOption value="Retain" label="Retain" />
                      </FormSelect>
                    </FormGroup>

                    <FormGroup label="Application Reference" isRequired fieldId="wizard-snapshot-application-ref">
                      <FormSelect
                        id="wizard-snapshot-application-ref-select"
                        value={wizardSnapshotApplicationRef}
                        onChange={(event) => {
                          const selectedApp = applicationOptions.find(app => app.name === event.currentTarget.value);
                          if (selectedApp) {
                            setWizardSnapshotApplicationRef(selectedApp.name);
                            setWizardSnapshotNamespace(selectedApp.namespace);
                          }
                        }}
                        isDisabled={!applicationsLoaded}
                      >
                        <FormSelectOption key="placeholder" value="" label="Select application reference" isPlaceholder />
                        {applicationOptions.map((app) => (
                          <FormSelectOption key={app.name} value={app.name} label={`${app.name} (${app.namespace})`} />
                        ))}
                      </FormSelect>
                    </FormGroup>

                    <FormGroup label="AppVault Reference" isRequired fieldId="wizard-snapshot-appvault-ref">
                      <FormSelect
                        id="wizard-snapshot-appvault-ref-select"
                        value={wizardSnapshotAppVaultRef}
                        onChange={(event) => setWizardSnapshotAppVaultRef(event.currentTarget.value)}
                        isDisabled={!appVaultsLoaded}
                      >
                        <FormSelectOption key="placeholder" value="" label="Select AppVault" isPlaceholder />
                        {appVaultOptions.map((appVault) => (
                          <FormSelectOption key={appVault.name} value={appVault.name} label={`${appVault.name} (${appVault.namespace})`} />
                        ))}
                      </FormSelect>
                    </FormGroup>

                    <Button 
                      variant="primary" 
                      onClick={handleSnapshotSubmit}
                      isDisabled={!wizardSnapshotName || !wizardSnapshotNamespace || !wizardSnapshotApplicationRef || !wizardSnapshotAppVaultRef}
                      style={{ marginTop: '1rem' }}
                    >
                      Create Remote Snapshot
                    </Button>
                  </Form>
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </WizardStep>

        <WizardStep name="Summary" id="summary-step">
          <TextContent>
            <Text component={TextVariants.h1}>Protection Setup Summary</Text>
            <Text component={TextVariants.p}>
              Congratulations! You have completed the application protection setup wizard. 
              Your application will now have comprehensive protection coverage.
            </Text>
            <Text component={TextVariants.h2}>What's Next?</Text>
            <TextList component={TextListVariants.ol}>
              <TextListItem>Monitor the Application Reference status in the main view</TextListItem>
              <TextListItem>Verify that scheduled snapshots and backups are running successfully</TextListItem>
              <TextListItem>Test restore procedures to ensure recovery capabilities</TextListItem>
              <TextListItem>Review and adjust retention policies based on your requirements</TextListItem>
            </TextList>
            <Text component={TextVariants.h2}>Monitoring and Management</Text>
            <TextList>
              <TextListItem>Use the Protection dashboard to monitor backup status</TextListItem>
              <TextListItem>Check the Snapshots and Backups views for detailed information</TextListItem>
              <TextListItem>Set up alerts for backup failures or policy violations</TextListItem>
              <TextListItem>Regularly test restore procedures</TextListItem>
            </TextList>
            <Text component={TextVariants.p}>
              For detailed configuration of each component, use the individual creation forms 
              available through the main interface.
            </Text>
          </TextContent>
        </WizardStep>
      </Wizard>
    </Modal>
  );
};

export default SusanooProtectionWizard;
