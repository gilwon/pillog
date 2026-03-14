import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/features/onboarding/components/OnboardingWizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/onboarding')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('health_concerns')
    .eq('id', user.id)
    .single()

  if (profile?.health_concerns && profile.health_concerns.length > 0) {
    redirect('/my')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <OnboardingWizard />
    </div>
  )
}
