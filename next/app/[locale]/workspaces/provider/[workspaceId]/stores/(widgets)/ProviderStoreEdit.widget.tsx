"use client";

import { ConsoleLogger } from '@/lib/logging/Console.logger';

import {
    useState,
    useEffect
} from 'react';
import {
    FiEdit3,
    FiSave
} from 'react-icons/fi'; // Importing icons
import { apiCall } from '@/lib/utils/Http.FetchApiSPA.util';

interface Store {
    id: number;
    title: string;
    description: string;
    phone: string;
    address: string;
    logo: string;
    cover: string;
}

export default function ProviderStoreEditWidget() {
    const [store, setUser] = useState<Store | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [isEditingAddress, setIsEditingAddress] = useState(false);

    const toggleEditPhone = () => setIsEditingPhone(!isEditingPhone);
    const toggleEditAddress = () => setIsEditingAddress(!isEditingAddress);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiCall({
                    method: 'GET',
                    url: '/api/my/store'
                });
                if (response.status !== 200) throw new Error('Failed to fetch store data');
                setUser(response.data);
            } catch (error) {
                ConsoleLogger.error('Error fetching store data:', error instanceof Error ? error.message : 'Unknown error');
            }
        };

        fetchData();
    }, []);

    if (!store) return <div>Loading...</div>;

    const handleSaveTitle = async () => {
        await updateStore('title', store.title);
        setIsEditingTitle(false); // Turn off edit mode after save
    };

    const handleSaveDescription = async () => {
        await updateStore('description', store.description);
        setIsEditingDescription(false); // Turn off edit mode after save
    };

    const handleSaveAddress = async () => {
        await updateStore('address', store.address);
        setIsEditingAddress(false); // Turn off edit mode after save
    };

    const handleSavePhone = async () => {
        await updateStore('phone', store.phone);
        setIsEditingPhone(false); // Turn off edit mode after save
    };

    const updateStore = async (field: keyof Store, value: string) => {
        try {
            const body = { [field]: value }; // Dynamic key based on the field to update
            const response = await apiCall({
                method: 'POST',
                url: `/api/my/store/update`,
                body
            });
            if (response.status !== 200) throw new Error('Failed to update store');
            // Update was successful
            ConsoleLogger.log('Store updated successfully');
            setUser((prev) => prev ? ({ ...prev, [field]: value }) : null); // Update local state to reflect changes
        } catch (error) {
            ConsoleLogger.error('Error updating store:', error instanceof Error ? error.message : 'Unknown error');
        }
    };

    const updateLogo = async (blob: Blob) => {

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('logo', blob, 'store-photo.webp');

            const response = await apiCall({
                method: 'POST',
                url: `/api/my/store/logo`,
                body: formData
            });

            if (response.status !== 200) {
                throw new Error(`Failed to update store photo`);
            }

            const data = response.data;

            ConsoleLogger.log('Store photo updated successfully', data);

            // Assuming 'data' includes a property with the URL of the new avatar
            // Update the store state with the new avatar URL to trigger UI refresh
            setUser(prevStore => prevStore ? ({
                ...prevStore,
                logo: data['url'] // Adjust the property name based on your actual API response
            }) : null);
        } catch (error) {
            ConsoleLogger.error('Error updating store photo:', error instanceof Error ? error.message : 'Unknown error');
        }
    };


    const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            ConsoleLogger.error('No file selected.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.drawImage(img, 0, 0);

                // Convert the canvas to a WebP blob
                canvas.toBlob((blob) => {
                    // Now call updateStorePhoto with the blob
                    if (blob) {
                        ConsoleLogger.log('Converted to WebP', blob);
                        updateLogo(blob); // Ensure this is uncommented and correctly called
                    }
                }, 'image/webp');
            };
            img.src = readerEvent.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const updateCover = async (blob: Blob) => {

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('cover', blob, 'store-photo.webp');

            const response = await apiCall({
                method: 'POST',
                url: `/api/my/store/cover`,
                body: formData
            });

            if (response.status !== 200) {
                throw new Error(`Failed to update store photo`);
            }

            const data = response.data;

            ConsoleLogger.log('Store photo updated successfully', data);

            // Assuming 'data' includes a property with the URL of the new avatar
            // Update the store state with the new avatar URL to trigger UI refresh
            setUser(prevStore => prevStore ? ({
                ...prevStore,
                cover: data['url'] // Adjust the property name based on your actual API response
            }) : null);
        } catch (error) {
            ConsoleLogger.error('Error updating store photo:', error instanceof Error ? error.message : 'Unknown error');
        }
    };


    const handleCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            ConsoleLogger.error('No file selected.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                ctx.drawImage(img, 0, 0);

                // Convert the canvas to a WebP blob
                canvas.toBlob((blob) => {
                    // Now call updateStorePhoto with the blob
                    if (blob) {
                        ConsoleLogger.log('Converted to WebP', blob);
                        updateCover(blob); // Ensure this is uncommented and correctly called
                    }
                }, 'image/webp');
            };
            img.src = readerEvent.target?.result as string;
        };
        reader.readAsDataURL(file);
    };


    const handleChange = (field: keyof Store, value: string) => {
        setUser((prev) => prev ? ({ ...prev, [field]: value }) : null);
    };

    return (
        <div className="max-w-4xl mx-auto py-10 px-4">
            <div className="text-left">
                {/* Avatar */}
                <div className='relative aspect-5/1'>
                    <div className='absolute w-full top-0 z-1'>
                        <img
                            src={`${process.env.NEXT_PUBLIC_S3_PREFIX}/covers/${store.id}/${store.cover}`}
                            alt="Avatar"
                            className="rounded-xl  object-cover aspect-5/1"
                        />
                        <div className="mt-6 absolute bottom-0 z-2">
                            <label htmlFor="cover" className="cursor-pointer bg-blue-700">
                                <FiEdit3 className="ml-2 cursor-pointer" />
                            </label>
                            <input
                                id="cover"
                                type="file"
                                onChange={handleCoverChange}
                                className="hidden"
                            />
                        </div>
                    </div>
                    <div className='absolute top-0 h-full flex items-center z-2'>
                        <img
                            src={`${process.env.NEXT_PUBLIC_S3_PREFIX}/logos/${store.id}/${store.logo}`}
                            alt="Avatar"
                            className="rounded-full w-32 h-32 object-cover border-2 border-white ml-12"
                        />
                        <div className="mt-6 bottom-0">
                            <label htmlFor="logo" className="cursor-pointer bg-blue-700">
                                <FiEdit3 className="ml-2 cursor-pointer" />
                            </label>
                            <input
                                id="logo"
                                type="file"
                                onChange={handleLogoChange}
                                className="hidden"
                            />
                        </div>
                    </div>
                </div>

                {/* Title with Edit/Save Icon */}
                <div className="mt-4 flex items-center">
                    {isEditingTitle ? (
                        <>
                            <input
                                type="text"
                                value={store.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                className="text-xl font-semibold text-gray-800 border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
                            />
                            <FiSave onClick={handleSaveTitle} className="ml-2 cursor-pointer" />
                        </>
                    ) : (
                        <>
                            <h1 className="text-xl font-semibold text-gray-800 cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                                {store.title}
                            </h1>
                            <FiEdit3 onClick={() => setIsEditingTitle(true)} className="ml-2 cursor-pointer" />
                        </>
                    )}
                </div>

                {/* Last Name with Edit/Save Icon */}
                <div className="mt-4 flex items-center">
                    {isEditingDescription ? (
                        <>
                            <textarea
                                value={store.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className="text-xl font-semibold text-gray-800 border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
                            />
                            <FiSave onClick={handleSaveDescription} className="ml-2 cursor-pointer" />
                        </>
                    ) : (
                        <>
                            <h1 className="text-xl font-semibold text-gray-800 cursor-pointer" onClick={() => setIsEditingDescription(true)}>
                                {store.description}
                            </h1>
                            <FiEdit3 onClick={() => setIsEditingDescription(true)} className="ml-2 cursor-pointer" />
                        </>
                    )}
                </div>

                {/* Address with Edit/Save Icon */}
                <div className="mt-6 flex items-center">
                    {isEditingAddress ? (
                        <>
                            <input
                                type="text"
                                value={store.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                className="text-md text-gray-800 border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
                            />
                            <FiSave onClick={handleSaveAddress} className="ml-2 cursor-pointer" />
                        </>
                    ) : (
                        <>
                            <p className="text-md text-gray-800 cursor-pointer" onClick={toggleEditAddress}>
                                Address: {store.address}
                            </p>
                            <FiEdit3 onClick={toggleEditAddress} className="ml-2 cursor-pointer" />
                        </>
                    )}
                </div>

                {/* Address with Edit/Save Icon */}
                <div className="mt-6 flex items-center">
                    {isEditingPhone ? (
                        <>
                            <input
                                type="tel"
                                value={store.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="text-md text-gray-800 border-b-2 border-gray-300 focus:outline-none focus:border-blue-500"
                            />
                            <FiSave onClick={handleSavePhone} className="ml-2 cursor-pointer" />
                        </>
                    ) : (
                        <>
                            <p className="text-md text-gray-800 cursor-pointer" onClick={toggleEditPhone}>
                                Phone: {store.phone}
                            </p>
                            <FiEdit3 onClick={toggleEditPhone} className="ml-2 cursor-pointer" />
                        </>
                    )}
                </div>

                {/* Links */}
                <ul className="mt-6 space-y-2">
                    <li><a href="#" className="text-blue-600 hover:underline">Store Cards</a></li>
                </ul>
            </div>
        </div>
    );
}

