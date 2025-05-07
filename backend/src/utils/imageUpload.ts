import * as admin from 'firebase-admin';

export const uploadImage = async (file: Express.Multer.File, path: string): Promise<string> => {
  try {
    const bucket = admin.storage().bucket();
    const fileName = `${path}/${Date.now()}-${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => {
        reject(error);
      });

      stream.on('finish', async () => {
        // Make the file public
        await fileUpload.makePublic();
        
        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        resolve(publicUrl);
      });

      stream.end(file.buffer);
    });
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Error uploading image');
  }
};

export const deleteImage = async (url: string): Promise<void> => {
  try {
    const bucket = admin.storage().bucket();
    const fileName = url.split(`${bucket.name}/`)[1];
    await bucket.file(fileName).delete();
  } catch (error) {
    console.error('Image deletion error:', error);
    throw new Error('Error deleting image');
  }
}; 