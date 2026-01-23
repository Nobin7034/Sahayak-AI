import axios from 'axios';

const checkExistingDocuments = async () => {
  try {
    console.log('🔍 Checking existing services and their document requirements...\n');

    // 1. Get all services
    console.log('📋 Fetching all services...');
    const servicesResponse = await axios.get('http://localhost:5000/api/services');
    
    if (!servicesResponse.data.success) {
      console.log('❌ Failed to fetch services');
      return;
    }

    const services = servicesResponse.data.data;
    console.log(`✅ Found ${services.length} services`);

    // 2. Check each service's document requirements
    for (const service of services.slice(0, 3)) { // Test first 3 services
      console.log(`\n📄 Testing service: ${service.name}`);
      console.log(`   ID: ${service._id}`);
      
      try {
        const docResponse = await axios.get(`http://localhost:5000/api/documents/service/${service._id}`);
        
        if (docResponse.data.success) {
          const requirements = docResponse.data.data;
          console.log(`   ✅ Document requirements found`);
          console.log(`   📊 Total documents: ${requirements.documents?.length || 0}`);
          
          if (requirements.documents && requirements.documents.length > 0) {
            requirements.documents.forEach((doc, index) => {
              console.log(`\n   📄 Document ${index + 1}: ${doc.name}`);
              console.log(`      - Reference Image: ${doc.referenceImage || 'None'}`);
              console.log(`      - Sample URL: ${doc.sampleUrl || 'None'}`);
              console.log(`      - Image URL: ${doc.imageUrl || 'None'}`);
              console.log(`      - Category: ${doc.category || 'None'}`);
              console.log(`      - Required: ${doc.isRequired || doc.isMandatory || 'Unknown'}`);
              
              if (doc.alternatives && doc.alternatives.length > 0) {
                console.log(`      - Alternatives: ${doc.alternatives.length}`);
                doc.alternatives.forEach((alt, altIndex) => {
                  console.log(`        Alt ${altIndex + 1}: ${alt.name} - Image: ${alt.referenceImage || alt.imageUrl || 'None'}`);
                });
              }
            });
          } else {
            console.log('   ⚠️ No documents found in requirements');
          }
        } else {
          console.log(`   ❌ Failed to fetch document requirements: ${docResponse.data.message}`);
        }
      } catch (docError) {
        console.log(`   ❌ Error fetching document requirements: ${docError.message}`);
      }
    }

    // 3. Check document templates
    console.log('\n\n🖼️ Checking document templates...');
    try {
      const templatesResponse = await axios.get('http://localhost:5000/api/admin/document-templates', {
        headers: {
          'Authorization': 'Bearer dummy-token' // This might fail but let's try
        }
      });
      
      if (templatesResponse.data.success) {
        console.log(`✅ Found ${templatesResponse.data.data.length} document templates`);
        templatesResponse.data.data.forEach((template, index) => {
          console.log(`   Template ${index + 1}: ${template.title}`);
          console.log(`      Image URL: ${template.imageUrl}`);
        });
      }
    } catch (templateError) {
      console.log(`❌ Could not fetch templates (auth required): ${templateError.response?.status || templateError.message}`);
    }

    console.log('\n✅ Document check completed!');

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
};

// Run the check
checkExistingDocuments();