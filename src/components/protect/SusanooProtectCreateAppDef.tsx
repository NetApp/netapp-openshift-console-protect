import * as React from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  Switch,
  Button,
  Modal,
  Split,
  SplitItem,
  FormSelect,
  FormSelectOption,
} from '@patternfly/react-core';
import { k8sCreate, useK8sWatchResource, K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { PlusCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';

type ApplicationFormProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ApplicationForm: React.FC<ApplicationFormProps> = ({ isOpen, onClose }) => {
  const [name, setName] = React.useState('');
  const [namespace, setNamespace] = React.useState('');
  const [skipVmFreeze, setSkipVmFreeze] = React.useState(true); // Default state set to true
  const [includedNamespaces, setIncludedNamespaces] = React.useState(['']);
  const [namespaceFilter, setNamespaceFilter] = React.useState<string[]>(['']);

  const namespaceResource = {
    kind: 'Namespace',
    isList: true,
  };

  const [namespaces, namespacesLoaded] = useK8sWatchResource<K8sResourceCommon[]>(namespaceResource);
  const namespaceOptions = React.useMemo(() => 
    Array.isArray(namespaces) ? namespaces.map(ns => ns.metadata?.name || '') : [], 
    [namespaces]
  );

  const getFilteredOptions = (filter: string) => {
    return namespaceOptions.filter(namespace => 
      namespace.toLowerCase().includes(filter.toLowerCase())
    );
  };

  const addNamespace = () => {
    setIncludedNamespaces([...includedNamespaces, '']);
    setNamespaceFilter([...namespaceFilter, '']);
  };

  const removeNamespace = (index: number) => {
    setIncludedNamespaces(includedNamespaces.filter((_, i) => i !== index));
    setNamespaceFilter(namespaceFilter.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !namespace || !includedNamespaces.some(ns => ns.trim())) {
      console.error('Required fields are missing');
      return;
    }

    const application = {
      apiVersion: 'protect.trident.netapp.io/v1',
      kind: 'Application',
      metadata: {
        name,
        namespace,
        annotations: {
          'protect.trident.netapp.io/skip-vm-freeze': skipVmFreeze.toString()
        }
      },
      spec: {
        includedNamespaces: includedNamespaces
          .filter(ns => ns.trim())
          .map(ns => ({
            labelSelector: {}, // Optional labelSelector
            namespace: ns
          }))
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
        ns: namespace
      });
      console.log('Application created successfully');
      onClose();
    } catch (err) {
      console.error('Failed to create Application:', err);
    }
  };

  const handleCancel = () => {
    setName('');
    setNamespace('');
    setSkipVmFreeze(true);
    setIncludedNamespaces(['']);
    setNamespaceFilter(['']);
    onClose();
  };

  const handleNamespaceChange = (event: React.FormEvent<HTMLSelectElement>) => {
    const selectedNamespace = event.currentTarget.value;
    setNamespace(selectedNamespace);
    setIncludedNamespaces([selectedNamespace, ...includedNamespaces.slice(1)]);
  };

  return (
    <Modal
      variant="medium"
      title="Create an Application Reference"
      isOpen={isOpen}
      onClose={handleCancel}
      actions={[
        <Button 
          key="create" 
          variant="primary" 
          onClick={handleSubmit}
          isDisabled={!name || !namespace || !includedNamespaces.some(ns => ns.trim())}
        >
          Create
        </Button>,
        <Button key="cancel" variant="link" onClick={handleCancel}>
          Cancel
        </Button>
      ]}
    >
      <Form>
        <FormGroup label="Application Backup Name" isRequired fieldId="app-name">
          <TextInput
            id="app-name"
            value={name}
            onChange={(_event, val) => setName(val)}
            isRequired
          />
        </FormGroup>

        <FormGroup label="Select the Application Namespace" isRequired fieldId="app-namespace">
          <FormSelect
            id="namespace-select"
            value={namespace}
            onChange={handleNamespaceChange}
            isDisabled={!namespacesLoaded}
          >
            <FormSelectOption key="placeholder" value="" label="Select namespace" isPlaceholder />
            {getFilteredOptions('').map((namespace) => (
              <FormSelectOption key={namespace} value={namespace} label={namespace} />
            ))}
          </FormSelect>
        </FormGroup>

        <FormGroup label="Skip VM Freeze (checked by default for containerized application)" fieldId="skip-vm-freeze">
          <Switch
            id="skip-vm-freeze"
            label="Skip VM Freeze"
            isChecked={skipVmFreeze}
            onChange={(_event, checked) => setSkipVmFreeze(checked)}
          />
        </FormGroup>

        <FormGroup label="Included Additional Namespaces" isRequired>
          <Split hasGutter style={{ marginBottom: '0.5rem' }}>
            <SplitItem isFilled>
              <TextInput
                id="main-namespace"
                value={namespace}
                readOnly={true}
              />
            </SplitItem>
          </Split>
          {includedNamespaces.slice(1).map((ns, index) => (
            <Split key={index + 1} hasGutter style={{ marginBottom: '0.5rem' }}>
              <SplitItem isFilled>
                <FormSelect
                  id={`namespace-select-${index + 1}`}
                  value={ns}
                  onChange={(event) => {
                    const updated = [...includedNamespaces];
                    updated[index + 1] = event.currentTarget.value;
                    setIncludedNamespaces(updated);
                  }}
                  isDisabled={!namespacesLoaded}
                >
                  <FormSelectOption key="placeholder" value="" label="Select namespace" isPlaceholder />
                  {getFilteredOptions(namespaceFilter[index + 1]).map((namespace) => (
                    <FormSelectOption key={namespace} value={namespace} label={namespace} />
                  ))}
                </FormSelect>
              </SplitItem>
              <SplitItem>
                <Button
                  variant="plain"
                  onClick={() => removeNamespace(index + 1)}
                  isDisabled={includedNamespaces.length === 2}
                >
                  <MinusCircleIcon />
                </Button>
              </SplitItem>
            </Split>
          ))}
          <Button
            variant="link"
            icon={<PlusCircleIcon />}
            onClick={addNamespace}
            style={{ padding: 0 }}
          >
            Add namespace
          </Button>
        </FormGroup>
      </Form>
    </Modal>
  );
};

export default ApplicationForm;