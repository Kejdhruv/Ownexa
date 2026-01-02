import supabase from "../../SupabaseClient.js";
import { upload } from "../../../Middleware/Middleware.js";
import { uploadFiles } from "./UploadFiles.js";
const AddProperty = async (data, user, files) => {

   const propertyImageUrls = await uploadFiles(
    files?.propertyImages,
    "Property-Images"
  );

  const legalDocumentUrls = await uploadFiles(
    files?.legalDocuments,
    "Legal-Documents"
  );
  
  const { data: property, error } = await supabase
    .from("properties")
    .insert({
      owner_id: user.id,
      owner_email: user.email,
      owner_name: data.ownerName,
      owner_accountaddress: data.accountaddress,
      
      title: data.title,
      bhk: data.bhk,
      property_type: data.propertyType,
      built_up_area_sqft: data.builtUpAreaSqFt,

      address_line: data.addressLine,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      country: data.country || "India",

      registry_name: data.registryName,
      registry_number: data.registryNumber,
      registration_date: data.registrationDate || null ,

      price_per_token_inr: data.expectedPriceInr,
      token_name: data.tokenName,

      property_images: propertyImageUrls || [],
      legal_documents: legalDocumentUrls || [],

      status: "pending",
      blockchain_id : "Not Added Yet" 
    })
    .select()
    .single();

  if (error) throw error;
  return property;
}; 


export default AddProperty;