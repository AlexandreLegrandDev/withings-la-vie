import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import SettingsLayout from '@/layouts/settings/layout';

export default function Appearance() {
    return (
        <SettingsLayout>
            <div className="space-y-6">
                <HeadingSmall title="Apparence" description="Choisis un thème clair, sombre, ou celui du téléphone" />
                <AppearanceTabs />
            </div>
        </SettingsLayout>
    );
}
