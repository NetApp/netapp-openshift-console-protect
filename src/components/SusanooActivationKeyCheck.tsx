import * as React from 'react';
import { useK8sWatchResource, K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';

interface SecretResource extends K8sResourceCommon {
  data?: {
    [key: string]: string;
  };
}

const useActivationKeyCheck = () => {
  const [isValidKey, setIsValidKey] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const secretResource = {
    group: '',
    version: 'v1',
    kind: 'Secret',
    name: 'susanoo-activation-key',
    namespace: 'trident',
  };

  const [secret, secretLoaded, secretError] = useK8sWatchResource<SecretResource>(secretResource);

  React.useEffect(() => {
    if (secretLoaded && !secretError) {
      const activationKey = secret?.data?.activationKey 
        ? atob(secret.data.activationKey) 
        : '';
      setIsValidKey(activationKey === 'test');
    }
    setIsLoading(false);
  }, [secret, secretLoaded, secretError]);

  return { isValidKey, isLoading };
};

export default useActivationKeyCheck;