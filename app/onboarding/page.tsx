import { getGlobalBillingDefaults } from '@/app/actions/billing';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const defaults = await getGlobalBillingDefaults();
  
  return <OnboardingClient defaultPrices={defaults} />;
}
