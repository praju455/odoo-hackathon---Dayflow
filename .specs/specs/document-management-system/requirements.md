# Requirements Document

## Introduction

The Document Management System (DMS) provides secure storage, organization, and retrieval of various document types within the Dayflow HRMS admin dashboard. The system enables administrators to upload, categorize, associate documents with employees, and manage company-wide documentation such as policies, handbooks, and templates. Documents are stored using Supabase Storage with metadata tracked in the PostgreSQL database via Prisma ORM.

## Glossary

- **DMS**: Document Management System - the feature being developed
- **Admin**: User with role "ADMIN" who has full access to upload, view, delete, and manage all documents
- **Employee**: User with role "EMPLOYEE" who can view documents associated with their user account
- **Manager**: User with role "MANAGER" who has intermediate access between Admin and Employee
- **Document**: A file uploaded to the system (PDF, Excel, Word, image, etc.) with associated metadata
- **Document_Metadata**: Database record containing document information (filename, type, size, category, associations, upload date)
- **Supabase_Storage**: Cloud storage service used for storing physical document files
- **Category**: Classification type for documents (e.g., "Employee Documents", "Company Policies", "Forms", "Templates")
- **Associated_Document**: A document linked to a specific employee's user account
- **Company_Wide_Document**: A document accessible to all users, not associated with any specific employee
- **File_Validator**: Component that validates file type, size, and content before upload
- **Storage_API**: Backend API routes for document upload, download, deletion, and retrieval operations
- **Document_UI**: Frontend interface in the admin dashboard for document management operations

## Requirements

### Requirement 1: Document Upload

**User Story:** As an Admin, I want to upload various document types to the system, so that I can store important company and employee documents securely.

#### Acceptance Criteria

1. WHEN an Admin selects a file for upload, THE File_Validator SHALL verify the file type is one of: PDF, DOCX, DOC, XLSX, XLS, CSV, PNG, JPG, JPEG, GIF, TXT
2. WHEN an Admin selects a file for upload, THE File_Validator SHALL verify the file size does not exceed 10 megabytes
3. IF the file type is not supported, THEN THE File_Validator SHALL return an error message stating "File type not supported. Allowed types: PDF, Word, Excel, Images, Text"
4. IF the file size exceeds 10 megabytes, THEN THE File_Validator SHALL return an error message stating "File size exceeds 10MB limit"
5. WHEN a file passes validation, THE Storage_API SHALL upload the file to Supabase_Storage
6. WHEN the file upload to Supabase_Storage completes, THE Storage_API SHALL create a Document_Metadata record in the database with filename, file type, file size, upload timestamp, and uploader user ID
7. WHEN the Document_Metadata record is created successfully, THE Storage_API SHALL return a success response with the document ID and metadata
8. IF the Supabase_Storage upload fails, THEN THE Storage_API SHALL return an error message and SHALL NOT create a Document_Metadata record

### Requirement 2: Document Categorization

**User Story:** As an Admin, I want to organize documents into categories, so that I can easily locate and manage related documents.

#### Acceptance Criteria

1. THE DMS SHALL support the following document categories: "Employee Documents", "Company Policies", "HR Forms", "Templates", "Contracts", "Certifications", "Handbooks", "Other"
2. WHEN an Admin uploads a document, THE Document_UI SHALL require the Admin to select one category from the supported categories list
3. WHEN a category is selected, THE Storage_API SHALL store the category value in the Document_Metadata record
4. WHEN an Admin views the document list, THE Document_UI SHALL display documents grouped by category
5. WHEN an Admin filters documents by category, THE Storage_API SHALL return only documents matching the selected category

### Requirement 3: Employee Document Association

**User Story:** As an Admin, I want to associate documents with specific employees, so that employee-specific documents like contracts and certifications are linked to the correct employee record.

#### Acceptance Criteria

1. WHEN an Admin uploads a document with category "Employee Documents", "Contracts", or "Certifications", THE Document_UI SHALL require the Admin to select an employee from the user list
2. WHEN an employee is selected, THE Storage_API SHALL store the employee user ID in the Document_Metadata record as the associated employee
3. WHEN a document is associated with an employee, THE Storage_API SHALL create the association with the employee's user ID
4. WHEN an Admin views an employee profile, THE Document_UI SHALL display all documents associated with that employee
5. WHEN an Employee views their own profile, THE Document_UI SHALL display only documents associated with their user ID
6. WHERE a document is not associated with any employee, THE DMS SHALL treat it as a Company_Wide_Document accessible to all users

### Requirement 4: Company-Wide Document Management

**User Story:** As an Admin, I want to store company-wide documents like policies and handbooks, so that all employees can access important company information.

#### Acceptance Criteria

1. WHEN an Admin uploads a document without an employee association, THE Storage_API SHALL create a Company_Wide_Document by setting the associated employee field to null in Document_Metadata
2. WHEN any user requests company-wide documents, THE Storage_API SHALL return all Document_Metadata records where the associated employee field is null
3. THE DMS SHALL allow all users (Admin, Manager, Employee) to view and download Company_Wide_Documents
4. WHEN an Admin uploads a document with category "Company Policies", "Handbooks", or "Templates", THE DMS SHALL automatically create it as a Company_Wide_Document
5. WHEN any user views the company-wide documents list, THE Document_UI SHALL display all Company_Wide_Documents sorted by upload date in descending order

### Requirement 5: Document Viewing and Download

**User Story:** As an Admin, I want to view and download stored documents, so that I can access and share important files when needed.

#### Acceptance Criteria

1. WHEN an Admin requests a document list, THE Storage_API SHALL return all Document_Metadata records with document ID, filename, category, file size, upload date, and associated employee information
2. WHEN an Admin clicks on a document, THE Storage_API SHALL generate a secure temporary download URL from Supabase_Storage valid for 60 seconds
3. WHEN the temporary URL is generated, THE Document_UI SHALL initiate the document download to the Admin's device
4. WHEN an Employee requests their associated documents, THE Storage_API SHALL return only Document_Metadata records where the associated employee ID matches the requesting Employee's user ID or where the document is a Company_Wide_Document
5. WHEN a Manager requests documents, THE Storage_API SHALL return documents associated with employees under their management, their own associated documents, and all Company_Wide_Documents
6. IF a user requests a document they do not have permission to access, THEN THE Storage_API SHALL return an error with status code 403 and message "Access denied"

### Requirement 6: Document Deletion

**User Story:** As an Admin, I want to delete documents that are no longer needed, so that I can maintain an organized and current document repository.

#### Acceptance Criteria

1. WHEN an Admin requests to delete a document, THE Storage_API SHALL verify the requesting user has role "ADMIN"
2. IF the requesting user does not have role "ADMIN", THEN THE Storage_API SHALL return an error with status code 403 and message "Only administrators can delete documents"
3. WHEN deletion is authorized, THE Storage_API SHALL delete the physical file from Supabase_Storage
4. WHEN the physical file is deleted from Supabase_Storage, THE Storage_API SHALL delete the corresponding Document_Metadata record from the database
5. WHEN both deletions complete successfully, THE Storage_API SHALL return a success response with message "Document deleted successfully"
6. IF the Supabase_Storage deletion fails, THEN THE Storage_API SHALL return an error message and SHALL NOT delete the Document_Metadata record
7. WHEN a document is deleted, THE Document_UI SHALL remove the document from the displayed list without requiring a page refresh

### Requirement 7: Document Search and Filtering

**User Story:** As an Admin, I want to search and filter documents, so that I can quickly find specific documents among many stored files.

#### Acceptance Criteria

1. WHEN an Admin enters text in the search field, THE Storage_API SHALL return Document_Metadata records where the filename contains the search text (case-insensitive)
2. WHEN an Admin selects a category filter, THE Storage_API SHALL return only Document_Metadata records matching the selected category
3. WHEN an Admin selects an employee filter, THE Storage_API SHALL return only Document_Metadata records associated with the selected employee
4. WHEN an Admin applies multiple filters simultaneously, THE Storage_API SHALL return Document_Metadata records matching all applied filters using AND logic
5. WHEN an Admin selects a date range filter, THE Storage_API SHALL return only Document_Metadata records where the upload date falls within the specified range
6. WHEN no documents match the search or filter criteria, THE Document_UI SHALL display a message "No documents found matching your criteria"

### Requirement 8: Document Metadata Management

**User Story:** As an Admin, I want to view detailed document metadata, so that I can understand document properties and manage documents effectively.

#### Acceptance Criteria

1. WHEN a document is uploaded, THE Storage_API SHALL store the following metadata in Document_Metadata: document ID, filename, original filename, file type, file size in bytes, category, associated employee ID (nullable), uploader user ID, upload timestamp, Supabase Storage path
2. WHEN an Admin views a document's details, THE Document_UI SHALL display all stored metadata fields in a readable format
3. WHEN displaying file size, THE Document_UI SHALL convert bytes to human-readable format (KB, MB)
4. WHEN displaying upload timestamp, THE Document_UI SHALL format it to the user's local timezone
5. WHEN displaying associated employee, THE Document_UI SHALL show the employee's name and employee ID, not just the user ID
6. WHEN displaying uploader information, THE Document_UI SHALL show the uploader's name, not just the user ID

### Requirement 9: Access Control and Security

**User Story:** As an Admin, I want role-based access control for document operations, so that only authorized users can perform sensitive operations like uploading and deleting documents.

#### Acceptance Criteria

1. THE Storage_API SHALL allow only users with role "ADMIN" to upload documents
2. THE Storage_API SHALL allow only users with role "ADMIN" to delete documents
3. THE Storage_API SHALL allow users with role "ADMIN" to view all documents
4. THE Storage_API SHALL allow users with role "MANAGER" to view documents associated with their direct reports, their own associated documents, and Company_Wide_Documents
5. THE Storage_API SHALL allow users with role "EMPLOYEE" to view only their own associated documents and Company_Wide_Documents
6. WHEN a user attempts an unauthorized operation, THE Storage_API SHALL return an error with status code 403 and an appropriate error message
7. WHEN generating download URLs, THE Storage_API SHALL create signed URLs from Supabase_Storage with 60-second expiration
8. THE Storage_API SHALL validate the JWT authentication token for all document operation requests

### Requirement 10: Database Schema and Storage Integration

**User Story:** As a developer, I want a well-defined database schema and storage integration, so that the document management system integrates seamlessly with the existing HRMS infrastructure.

#### Acceptance Criteria

1. THE DMS SHALL create a new Prisma model named "Document" in the schema with the following fields: id (String, UUID, primary key), userId (String, foreign key to User), associatedEmployeeId (String, nullable, foreign key to User), filename (String), originalFilename (String), fileType (String), fileSizeBytes (Int), category (String), storagePath (String), uploadedAt (DateTime), createdAt (DateTime), updatedAt (DateTime)
2. THE Document model SHALL have a relation to the User model for userId (uploader) with onDelete Cascade
3. THE Document model SHALL have a relation to the User model for associatedEmployeeId (associated employee) with onDelete SetNull
4. THE Storage_API SHALL store physical files in Supabase_Storage under the bucket path "hrms-documents/{companyId}/{category}/{documentId}_{filename}"
5. WHEN a user is deleted, THE DMS SHALL cascade delete all documents uploaded by that user (uploader relation)
6. WHEN an employee is deleted, THE DMS SHALL set the associatedEmployeeId to null for all their associated documents rather than deleting the documents
7. THE Storage_API SHALL create a Supabase Storage bucket named "hrms-documents" with private access policy if it does not exist
8. THE Storage_API SHALL configure Supabase Storage bucket policies to allow authenticated users to read files and only admins to upload or delete files

### Requirement 11: Error Handling and User Feedback

**User Story:** As an Admin, I want clear error messages and feedback during document operations, so that I understand what happened and can take corrective action if needed.

#### Acceptance Criteria

1. WHEN a document operation fails, THE Storage_API SHALL return an error response with a descriptive error message and appropriate HTTP status code
2. WHEN a file upload fails due to network issues, THE Document_UI SHALL display an error message "Upload failed due to network error. Please try again."
3. WHEN a file upload fails due to validation errors, THE Document_UI SHALL display the specific validation error message from the File_Validator
4. WHEN a document upload succeeds, THE Document_UI SHALL display a success message "Document uploaded successfully" with the document filename
5. WHEN a document deletion succeeds, THE Document_UI SHALL display a success message "Document deleted successfully"
6. WHEN a user attempts to download a document and the file is not found in Supabase_Storage, THE Storage_API SHALL return an error with status code 404 and message "Document file not found"
7. WHEN the Supabase_Storage service is unavailable, THE Storage_API SHALL return an error with status code 503 and message "Storage service temporarily unavailable. Please try again later."

### Requirement 12: Document List Display and Pagination

**User Story:** As an Admin, I want to view documents in a paginated list with sorting options, so that I can efficiently browse through many documents.

#### Acceptance Criteria

1. WHEN an Admin views the documents list, THE Document_UI SHALL display documents in a table or card layout with columns: filename, category, file size, associated employee, upload date, and actions
2. THE Document_UI SHALL display 20 documents per page by default
3. WHEN there are more than 20 documents, THE Document_UI SHALL provide pagination controls (previous, next, page numbers)
4. WHEN an Admin clicks a column header, THE Document_UI SHALL sort the documents by that column in ascending order
5. WHEN an Admin clicks the same column header again, THE Document_UI SHALL sort the documents by that column in descending order
6. THE Storage_API SHALL support pagination parameters: page number and items per page
7. WHEN the Storage_API returns paginated results, it SHALL include metadata: total documents count, current page, total pages, items per page
