import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile - Inkloom',
  description: 'Your profile page',
};

export default function ProfilePage() {
  return (
    <div>
      <h1>Profile</h1>
      <p>Your profile page</p>
    </div>
  );
}

