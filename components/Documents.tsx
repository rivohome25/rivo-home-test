'use client';
import { useState, useEffect } from 'react';
import { supabase, auth } from './utils/supabaseClient';

export default function Documents() {
  const [docs, setDocs] = useState<{ id: string; name: string; url: string }[]>([]);
  const [error, setError] = useState<string>();
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const user = await auth.user();
        const { data, error } = await supabase
          .storage
          .from('documents')
          .list(user?.id || '', { limit: 100 });
        if (error) throw error;
        
        if (data) {
          // build url for each object
          const signedUrls = await Promise.all(
            data.map(async (obj: any) => {
              const { data: urlData } = supabase
                .storage
                .from('documents')
                .getPublicUrl(`${user?.id}/${obj.name}`);
              return { id: obj.id, name: obj.name, url: urlData.publicUrl };
            })
          );
          setDocs(signedUrls);
        }
      } catch (err: any) {
        setError(err.message);
      }
    })();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    if (docs.length >= 3) return;
    
    try {
      setUploading(true);
      const user = await auth.user();
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }
      
      const path = `${user.id}/${file.name}`;
      const { error: uploadError } = await supabase
        .storage
        .from('documents')
        .upload(path, file, {
          metadata: { user_id: user.id }
        });
        
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase
        .storage
        .from('documents')
        .getPublicUrl(path);
      setDocs([{ id: path, name: file.name, url: urlData.publicUrl }, ...docs]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .storage
      .from('documents')
      .remove([ id ]);
    if (error) setError(error.message);
    else setDocs(docs.filter(d => d.id !== id));
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">Document Storage</h3>
      {error && <p className="text-red-600">{error}</p>}

      <input
        type="file"
        accept=".pdf,.doc,.docx"
        disabled={uploading || docs.length >= 3}
        onChange={handleUpload}
        className="mb-4"
      />
      {docs.length >= 3 && (
        <p className="text-yellow-600 text-sm mb-4">
          You've reached the 3-document limit. Delete one to upload another.
        </p>
      )}

      <ul className="space-y-2">
        {docs.map(doc => (
          <li key={doc.id} className="flex justify-between items-center">
            <a href={doc.url} target="_blank" rel="noopener" className="underline">
              {doc.name}
            </a>
            <button
              onClick={() => handleDelete(doc.id)}
              className="text-red-600 hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
} 