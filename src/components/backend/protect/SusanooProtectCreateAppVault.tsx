import * as React from 'react';
import {
  Form,
  FormGroup,
  TextInput,
  FormSelect,
  FormSelectOption,
  Button,
  Modal,
  Hint,
  HintBody,
  HintTitle,
  Switch,
} from '@patternfly/react-core';
import { k8sCreate, useK8sWatchResource, K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';

type AppVaultFormProps = {
  isOpen: boolean;
  onClose: () => void;
};

const AppVaultForm: React.FC<AppVaultFormProps> = ({ isOpen, onClose }) => {
  const [name, setName] = React.useState('');
  const [namespace, setNamespace] = React.useState('');
  const [showPlatformNamespaces, setShowPlatformNamespaces] = React.useState(false);
  const [dataMoverPasswordSecretRef, setDataMoverPasswordSecretRef] = React.useState('');
  const [providerType, setProviderType] = React.useState('OntapS3');
  const [bucketName, setBucketName] = React.useState('');
  const [endpoint, setEndpoint] = React.useState('');
  const [proxyURL, setProxyURL] = React.useState('');
  const [accessKeyID, setAccessKeyID] = React.useState('');
  const [secretAccessKey, setSecretAccessKey] = React.useState('');
  const [sessionToken, setSessionToken] = React.useState('');
  const [secure, setSecure] = React.useState(false);
  const [skipCertValidation, setSkipCertValidation] = React.useState(true);

  const namespaceResource = {
    kind: 'Namespace',
    isList: true,
  };

  const [namespaces, namespacesLoaded] = useK8sWatchResource<K8sResourceCommon[]>(namespaceResource);
  
  const filteredNamespaces = React.useMemo(() => {
    if (!Array.isArray(namespaces)) return [];
    return namespaces 
      .map(ns => ns.metadata?.name || '')
      .filter((ns) => 
        showPlatformNamespaces ? ns.startsWith('openshift') : !ns.startsWith('openshift')
      );
  }, [namespaces, showPlatformNamespaces]);

  const handleNamespaceToggle = (checked: boolean) => {
    setShowPlatformNamespaces(checked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !namespace || !bucketName || !endpoint || !accessKeyID || !secretAccessKey) {
      console.error('Required fields are missing');
      return;
    }

    const appVault = {
      apiVersion: 'protect.trident.netapp.io/v1',
      kind: 'AppVault',
      metadata: {
        name,
        namespace,
      },
      spec: {
        dataMoverPasswordSecretRef,
        providerType,
        providerConfig: {
          s3: {
            bucketName,
            endpoint,
            proxyURL,
            secure: secure.toString(),
            skipCertValidation: skipCertValidation.toString(),
          },
        },
        providerCredentials: {
          accessKeyID: {
            valueFromSecret: {
              key: 'accessKeyID',
              name: 's3_secret',
            },
          },
          secretAccessKey: {
            valueFromSecret: {
              key: 'secretAccessKey',
              name: 's3_secret',
            },
          },
          sessionToken: {
            valueFromSecret: {
              key: 'sessionToken',
              name: 's3_secret',
            },
          },
        },
      },
    };

    try {
      await k8sCreate({
        model: {
          apiGroup: 'protect.trident.netapp.io',
          apiVersion: 'v1',
          kind: 'AppVault',
          abbr: 'AV',
          label: 'AppVault',
          labelPlural: 'AppVaults',
          plural: 'appvaults',
          namespaced: true,
          crd: true,
        },
        data: appVault,
        ns: namespace,
      });
      console.log('AppVault created successfully');
      onClose();
    } catch (err) {
      console.error('Failed to create AppVault:', err);
    }
  };

  const handleCancel = () => {
    setName('');
    setNamespace('');
    setDataMoverPasswordSecretRef('');
    setProviderType('OntapS3');
    setBucketName('');
    setEndpoint('');
    setProxyURL('');
    setAccessKeyID('');
    setSecretAccessKey('');
    setSessionToken('');
    setSecure(false);
    setSkipCertValidation(true);
    onClose();
  };

  const handleSecureChange = (checked: boolean) => {
    setSecure(checked);
  };

  const handleSkipCertValidationChange = (checked: boolean) => {
    setSkipCertValidation(checked);
  };

  return (
    <Modal
      variant="medium"
      title="Create an AppVault"
      isOpen={isOpen}
      onClose={handleCancel}
      actions={[
        <Button 
          key="create" 
          variant="primary" 
          onClick={handleSubmit}
          isDisabled={!name || !namespace || !bucketName || !endpoint || !accessKeyID || !secretAccessKey}
        >
          Create
        </Button>,
        <Button key="cancel" variant="link" onClick={handleCancel}>
          Cancel
        </Button>
      ]}
    >
      <Form>
        <FormGroup label="AppVault Name" isRequired fieldId="appvault-name">
          <TextInput
            id="appvault-name"
            value={name}
            onChange={(_event, val) => setName(val)}
            isRequired
          />
        </FormGroup>

        <FormGroup label="Namespace Type" fieldId="namespace-type">
          <Switch
            id="namespace-type-switch"
            label="Platform"
            labelOff="Application"
            isChecked={showPlatformNamespaces}
            onChange={(_event, checked) => handleNamespaceToggle(checked)}
          />
        </FormGroup>        

        <FormGroup label="Namespace" isRequired fieldId="namespace">
          <FormSelect
            id="namespace-select"
            value={namespace}
            onChange={(event) => setNamespace(event.currentTarget.value)}
            isDisabled={!namespacesLoaded}
          >
            <FormSelectOption key="placeholder" value="" label="Select namespace" isPlaceholder />
            {filteredNamespaces.map((ns) => (
              <FormSelectOption key={ns} value={ns} label={ns} />
            ))}
          </FormSelect>
        </FormGroup>

        <FormGroup label="Data Mover Password Secret Reference" fieldId="data-mover-password-secret-ref">
          <TextInput
            id="data-mover-password-secret-ref"
            value={dataMoverPasswordSecretRef}
            onChange={(_event, val) => setDataMoverPasswordSecretRef(val)}
            isDisabled
          />
        </FormGroup>

        <FormGroup label="Provider Type" isRequired fieldId="provider-type">
          <FormSelect
            id="provider-type-select"
            value={providerType}
            onChange={(event) => setProviderType(event.currentTarget.value)}
          >
            <FormSelectOption value="OntapS3" label="OntapS3" />
            <FormSelectOption value="AWS" label="AWS" isDisabled />
            <FormSelectOption value="Azure" label="Azure" isDisabled />
            <FormSelectOption value="GCP" label="GCP" isDisabled />
            <FormSelectOption value="GenericS3" label="GenericS3" isDisabled />
            <FormSelectOption value="StorageGridS3" label="StorageGridS3" isDisabled />
          </FormSelect>
        </FormGroup>

        <FormGroup label="Bucket Name" isRequired fieldId="bucket-name">
          <TextInput
            id="bucket-name"
            value={bucketName}
            onChange={(_event, val) => setBucketName(val)}
            isRequired
          />
        </FormGroup>

        <FormGroup label="Endpoint" isRequired fieldId="endpoint">
          <TextInput
            id="endpoint"
            value={endpoint}
            onChange={(_event, val) => setEndpoint(val)}
            isRequired
          />
        </FormGroup>

        <FormGroup label="Proxy URL" fieldId="proxy-url">
          <TextInput
            id="proxy-url"
            value={proxyURL}
            onChange={(_event, val) => setProxyURL(val)}
          />
        </FormGroup>

        <FormGroup label="Access Key ID" isRequired fieldId="access-key-id">
          <TextInput
            id="access-key-id"
            type="password"
            value={accessKeyID}
            onChange={(_event, val) => setAccessKeyID(val)}
            isRequired
          />
        </FormGroup>

        <FormGroup label="Secret Access Key" isRequired fieldId="secret-access-key">
          <TextInput
            id="secret-access-key"
            type="password"
            value={secretAccessKey}
            onChange={(_event, val) => setSecretAccessKey(val)}
            isRequired
          />
        </FormGroup>

        <FormGroup label="Session Token" fieldId="session-token">
          <TextInput
            id="session-token"
            value={sessionToken}
            onChange={(_event, val) => setSessionToken(val)}
            isDisabled
          />
        </FormGroup>

        <FormGroup label="Secure" fieldId="secure">
          <Switch
            id="secure-switch"
            label="Secure"
            isChecked={secure}
            onChange={(_event, checked) => handleSecureChange(checked)}
          />
        </FormGroup>

        <FormGroup label="Skip Certificate Validation" fieldId="skip-cert-validation">
          <Switch
            id="skip-cert-validation-switch"
            label="Skip Certificate Validation"
            isChecked={skipCertValidation}
            onChange={(_event, checked) => handleSkipCertValidationChange(checked)}
          />
        </FormGroup>

        <Hint>
          <HintTitle>The Secret object will automatically be created with the provided value for accessKeyID and secretAccessKey</HintTitle>
          <HintBody>
            Please ensure that the values for accessKeyID and secretAccessKey are correct.
          </HintBody>
        </Hint>
      </Form>
    </Modal>
  );
};

export default AppVaultForm;