"use client";

import {
  useState,
  useEffect
} from 'react';
import {
  FiEdit3,
  FiSave
} from 'react-icons/fi';
import { apiCall } from '@/lib/utils/Http.FetchApiSPA.util';
import { loadClientSideCoLocatedTranslations } from '@/i18n/i18nClientSide';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
interface Account {
  id: number;
  name: string;
  last_name: string;
  phone: string;
  avatar?: string;
}

function PublicAccountWidget() {
  const { t } = loadClientSideCoLocatedTranslations('PublicAccountWidget');
  const [account, setAccount] = useState<Account | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingLastName, setIsEditingLastName] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  const toggleEditPhone = () => setIsEditingPhone(!isEditingPhone);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiCall({
          method: 'GET',
          url: '/api/my/account'
        });
        if (response.status !== 200) throw new Error('Failed to fetch account data');
        setAccount(response.data);
      } catch (error) {
        const err = error as Error;
        ConsoleLogger.error('Error fetching account data:', err.message);
      }
    };

    fetchData();
  }, []);

  if (!account) return <div>{t('loading')}</div>;

  const handleSaveName = async () => {
    await updateProfile('name', account.name);
    setIsEditingName(false);
  };

  const handleSaveLastName = async () => {
    await updateProfile('last_name', account.last_name);
    setIsEditingLastName(false);
  };

  const handleSavePhone = async () => {
    await updateProfile('phone', account.phone);
    setIsEditingPhone(false);
  };

  const updateProfile = async (field: keyof Account, value: string) => {
    try {
      const body = { [field]: value };
      const response = await apiCall({
        method: 'POST',
        url: '/api/my/account/update',
        body: body
      });
      if (response.status !== 200) throw new Error('Failed to update profile');
      ConsoleLogger.log('Profile updated successfully');
      setAccount((prev) => prev ? { ...prev, [field]: value } : null);
    } catch (error) {
      const err = error as Error;
      ConsoleLogger.error('Error updating profile:', err.message);
    }
  };

  const updateProfilePhoto = async (blob: Blob | null) => {
    if (!blob) return;

    try {
      const response = await apiCall({
        method: 'POST',
        url: `/api/my/account/avatar/${account.id}`,
        body: {
          files: [{
            fieldName: 'avatar',
            file: blob,
            fileName: 'profile-photo.webp'
          }]
        }
      });

      if (response.status !== 200) {
        throw new Error(`Failed to update profile photo: ${response.statusText}`);
      }

      const data = response.data;
      ConsoleLogger.log('Profile photo updated successfully', data);

      setAccount(prevUser => prevUser ? {
        ...prevUser,
        avatar: data['url']
      } : null);
    } catch (error) {
      const err = error as Error;
      ConsoleLogger.error('Error updating profile photo:', err.message);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      ConsoleLogger.error('No file selected.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
        }

        canvas.toBlob((blob) => {
          ConsoleLogger.log('Converted to WebP', blob);
          updateProfilePhoto(blob);
        }, 'image/webp');
      };
      const result = readerEvent.target?.result;
      if (typeof result === 'string') {
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (field: keyof Account, value: string) => {
    setAccount((prev) => prev ? { ...prev, [field]: value } : null);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="text-left">
        {/* Avatar */}
        <div className='relative'>
          <img
            src={`${process.env.NEXT_PUBLIC_S3_PREFIX}/avatars/${account.id}/${account.avatar}`}
            alt=" "
            className="rounded-full w-32 h-32 object-cover bg-gray-100"
          />
          <div className="mt-6 absolute bottom-0 z-10">
            <label htmlFor="profilePhoto" className="cursor-pointer bg-blue-700">
              <FiEdit3 className="ml-2 cursor-pointer" />
            </label>
            <input
              id="profilePhoto"
              type="file"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
        {/* Name with Edit/Save Icon */}
        <div className="mt-4 flex items-center">
          {isEditingName ? (
            <>
              <input
                type="text"
                value={account.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="text-xl font-semibold text-gray-800 border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
              />
              <FiSave onClick={handleSaveName} className="ml-2 cursor-pointer" />
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-800 cursor-pointer" onClick={() => setIsEditingName(true)}>
                {account.name}
              </h1>
              <FiEdit3 onClick={() => setIsEditingName(true)} className="ml-2 cursor-pointer" />
            </>
          )}
        </div>

        {/* Last Name with Edit/Save Icon */}
        <div className="mt-4 flex items-center">
          {isEditingLastName ? (
            <>
              <input
                type="text"
                value={account.last_name}
                onChange={(e) => handleChange('last_name', e.target.value)}
                className="text-xl font-semibold text-gray-800 border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
              />
              <FiSave onClick={handleSaveLastName} className="ml-2 cursor-pointer" />
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-gray-800 cursor-pointer" onClick={() => setIsEditingLastName(true)}>
                {account.last_name}
              </h1>
              <FiEdit3 onClick={() => setIsEditingLastName(true)} className="ml-2 cursor-pointer" />
            </>
          )}
        </div>

        {/* Phone Number with Edit/Save Icon */}
        <div className="mt-6 flex items-center">
          {isEditingPhone ? (
            <>
              <input
                type="tel"
                value={account.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="text-md text-gray-800 border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
              />
              <FiSave onClick={handleSavePhone} className="ml-2 cursor-pointer" />
            </>
          ) : (
            <>
              <p className="text-md text-gray-800 cursor-pointer" onClick={toggleEditPhone}>
                {t('phone')}: {account.phone}
              </p>
              <FiEdit3 onClick={toggleEditPhone} className="ml-2 cursor-pointer" />
            </>
          )}
        </div>

        {/* Links */}
        <ul className="mt-6 space-y-2">
          <li><a href="/my/store/" className="text-blue-600 hover:underline">{t('store_management')}</a></li>
          <li><a href="#" className="text-blue-600 hover:underline">{t('my_cards')}</a></li>
          <li><a href="#" className="text-blue-600 hover:underline">{t('my_favorites')}</a></li>
          <li><a href="#" className="text-blue-600 hover:underline">{t('my_bookmarks')}</a></li>
          {/* <LogoutButton /> */}
        </ul>
      </div>
    </div >
  );
}

export default PublicAccountWidget;
