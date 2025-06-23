import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Image,
} from "react-native";
import { Avatar, ProgressBar } from "react-native-paper";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  FileText,
  Camera,
  Upload,
  CheckCircle,
  Shield,
  BookOpen,
  Clock,
  AlertTriangle,
  ArrowRight,
  X,
} from "lucide-react-native";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";

interface DriverOnboardingProps {
  isDarkMode?: boolean;
  onComplete?: () => void;
  onClose?: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  completed: boolean;
  current: boolean;
}

const DriverOnboarding = ({
  isDarkMode = false,
  onComplete = () => {},
  onClose = () => {},
}: DriverOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: "",
    phone: "",
    email: "",
    address: "",
    emergencyContact: "",
    guarantorName: "",
    guarantorPhone: "",

    // Vehicle Information
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleColor: "",
    licensePlate: "",
    seatingCapacity: "",
    isAC: false,

    // Documents
    drivingLicense: null,
    vehicleRC: null,
    insurance: null,
    policeVerification: null,
    medicalCertificate: null,

    // Training
    trainingCompleted: false,
    safetyQuizScore: 0,
  });

  const steps: OnboardingStep[] = [
    {
      id: "personal",
      title: "Personal Information",
      description: "Basic details and emergency contacts",
      icon: User,
      completed: false,
      current: currentStep === 0,
    },
    {
      id: "vehicle",
      title: "Vehicle Details",
      description: "Your vehicle information",
      icon: Car,
      completed: false,
      current: currentStep === 1,
    },
    {
      id: "documents",
      title: "Document Upload",
      description: "Required verification documents",
      icon: FileText,
      completed: false,
      current: currentStep === 2,
    },
    {
      id: "training",
      title: "Safety Training",
      description: "Complete mandatory training",
      icon: BookOpen,
      completed: false,
      current: currentStep === 3,
    },
    {
      id: "verification",
      title: "Verification",
      description: "Background check and approval",
      icon: Shield,
      completed: false,
      current: currentStep === 4,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDocumentUpload = (documentType: string) => {
    Alert.alert("Upload Document", `Select ${documentType}`, [
      { text: "Camera", onPress: () => console.log("Camera selected") },
      { text: "Gallery", onPress: () => console.log("Gallery selected") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const renderProgressHeader = () => (
    <View
      style={[
        styles.progressHeader,
        { backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF" },
      ]}
    >
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <X size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
      </TouchableOpacity>

      <View style={styles.progressContent}>
        <Text
          style={[
            styles.progressTitle,
            { color: isDarkMode ? "#FFFFFF" : "#000000" },
          ]}
        >
          Driver Registration
        </Text>
        <Text
          style={[
            styles.progressSubtitle,
            { color: isDarkMode ? "#CCCCCC" : "#666666" },
          ]}
        >
          Step {currentStep + 1} of {steps.length}
        </Text>
        <ProgressBar
          progress={(currentStep + 1) / steps.length}
          color="#000000"
          style={styles.progressBar}
        />
      </View>
    </View>
  );

  const renderStepIndicators = () => (
    <View style={styles.stepIndicators}>
      {steps.map((step, index) => (
        <View key={step.id} style={styles.stepIndicator}>
          <View
            style={[
              styles.stepCircle,
              {
                backgroundColor:
                  index <= currentStep
                    ? "#000000"
                    : isDarkMode
                    ? "#333333"
                    : "#E5E7EB",
              },
            ]}
          >
            <step.icon
              size={16}
              color={
                index <= currentStep
                  ? "#FFFFFF"
                  : isDarkMode
                  ? "#666666"
                  : "#9CA3AF"
              }
            />
          </View>
          <Text
            style={[
              styles.stepLabel,
              {
                color:
                  index <= currentStep
                    ? isDarkMode
                      ? "#FFFFFF"
                      : "#000000"
                    : isDarkMode
                    ? "#666666"
                    : "#9CA3AF",
              },
            ]}
          >
            {step.title}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderPersonalInfoStep = () => (
    <View style={styles.stepContent}>
      <Text
        style={[
          styles.stepTitle,
          { color: isDarkMode ? "#FFFFFF" : "#000000" },
        ]}
      >
        Personal Information
      </Text>
      <Text
        style={[
          styles.stepDescription,
          { color: isDarkMode ? "#CCCCCC" : "#666666" },
        ]}
      >
        Please provide your basic details and emergency contact information.
      </Text>

      <View style={styles.formSection}>
        <Input
          label="Full Name"
          value={formData.fullName}
          onChangeText={(text) => setFormData({ ...formData, fullName: text })}
          leftIcon={<User size={20} color="#CCCCCC" />}
          placeholder="Enter your full name"
          isDarkMode={isDarkMode}
        />

        <Input
          label="Phone Number"
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          leftIcon={<Phone size={20} color="#CCCCCC" />}
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          isDarkMode={isDarkMode}
        />

        <Input
          label="Email Address"
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          leftIcon={<Mail size={20} color="#CCCCCC" />}
          placeholder="your.email@gmail.com"
          keyboardType="email-address"
          isDarkMode={isDarkMode}
        />

        <Input
          label="Current Address"
          value={formData.address}
          onChangeText={(text) => setFormData({ ...formData, address: text })}
          leftIcon={<MapPin size={20} color="#CCCCCC" />}
          placeholder="Your complete address"
          multiline
          isDarkMode={isDarkMode}
        />

        <Input
          label="Emergency Contact"
          value={formData.emergencyContact}
          onChangeText={(text) =>
            setFormData({ ...formData, emergencyContact: text })
          }
          leftIcon={<Phone size={20} color="#CCCCCC" />}
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          isDarkMode={isDarkMode}
        />

        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? "#FFFFFF" : "#000000" },
          ]}
        >
          Guarantor Information
        </Text>
        <Text
          style={[
            styles.sectionDescription,
            { color: isDarkMode ? "#CCCCCC" : "#666666" },
          ]}
        >
          A local reference who can vouch for you
        </Text>

        <Input
          label="Guarantor Name"
          value={formData.guarantorName}
          onChangeText={(text) =>
            setFormData({ ...formData, guarantorName: text })
          }
          leftIcon={<User size={20} color="#CCCCCC" />}
          placeholder="Guarantor's full name"
          isDarkMode={isDarkMode}
        />

        <Input
          label="Guarantor Phone"
          value={formData.guarantorPhone}
          onChangeText={(text) =>
            setFormData({ ...formData, guarantorPhone: text })
          }
          leftIcon={<Phone size={20} color="#CCCCCC" />}
          placeholder="+91 98765 43210"
          keyboardType="phone-pad"
          isDarkMode={isDarkMode}
        />
      </View>
    </View>
  );

  const renderVehicleInfoStep = () => (
    <View style={styles.stepContent}>
      <Text
        style={[
          styles.stepTitle,
          { color: isDarkMode ? "#FFFFFF" : "#000000" },
        ]}
      >
        Vehicle Information
      </Text>
      <Text
        style={[
          styles.stepDescription,
          { color: isDarkMode ? "#CCCCCC" : "#666666" },
        ]}
      >
        Provide details about your vehicle that will be used for rides.
      </Text>

      <View style={styles.formSection}>
        <Input
          label="Vehicle Make"
          value={formData.vehicleMake}
          onChangeText={(text) =>
            setFormData({ ...formData, vehicleMake: text })
          }
          leftIcon={<Car size={20} color="#CCCCCC" />}
          placeholder="e.g., Maruti, Honda, Hyundai"
          isDarkMode={isDarkMode}
        />

        <Input
          label="Vehicle Model"
          value={formData.vehicleModel}
          onChangeText={(text) =>
            setFormData({ ...formData, vehicleModel: text })
          }
          leftIcon={<Car size={20} color="#CCCCCC" />}
          placeholder="e.g., Swift Dzire, City, Creta"
          isDarkMode={isDarkMode}
        />

        <View style={styles.rowInputs}>
          <View style={styles.halfInput}>
            <Input
              label="Year"
              value={formData.vehicleYear}
              onChangeText={(text) =>
                setFormData({ ...formData, vehicleYear: text })
              }
              placeholder="2020"
              keyboardType="numeric"
              isDarkMode={isDarkMode}
            />
          </View>
          <View style={styles.halfInput}>
            <Input
              label="Color"
              value={formData.vehicleColor}
              onChangeText={(text) =>
                setFormData({ ...formData, vehicleColor: text })
              }
              placeholder="White"
              isDarkMode={isDarkMode}
            />
          </View>
        </View>

        <Input
          label="License Plate Number"
          value={formData.licensePlate}
          onChangeText={(text) =>
            setFormData({ ...formData, licensePlate: text })
          }
          placeholder="RJ14 CA 1234"
          autoCapitalize="characters"
          isDarkMode={isDarkMode}
        />

        <Input
          label="Seating Capacity"
          value={formData.seatingCapacity}
          onChangeText={(text) =>
            setFormData({ ...formData, seatingCapacity: text })
          }
          placeholder="4"
          keyboardType="numeric"
          isDarkMode={isDarkMode}
        />

        <TouchableOpacity
          style={[
            styles.checkboxRow,
            { borderColor: isDarkMode ? "#333333" : "#E5E7EB" },
          ]}
          onPress={() => setFormData({ ...formData, isAC: !formData.isAC })}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: formData.isAC ? "#000000" : "transparent",
                borderColor: formData.isAC
                  ? "#000000"
                  : isDarkMode
                  ? "#333333"
                  : "#E5E7EB",
              },
            ]}
          >
            {formData.isAC && <CheckCircle size={16} color="#FFFFFF" />}
          </View>
          <Text
            style={[
              styles.checkboxLabel,
              { color: isDarkMode ? "#FFFFFF" : "#000000" },
            ]}
          >
            Air Conditioned Vehicle
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDocumentsStep = () => {
    const documents = [
      {
        key: "drivingLicense",
        title: "Driving License",
        description: "Valid driving license (minimum 3 years)",
        required: true,
      },
      {
        key: "vehicleRC",
        title: "Vehicle Registration Certificate",
        description: "RC book of your vehicle",
        required: true,
      },
      {
        key: "insurance",
        title: "Vehicle Insurance",
        description: "Valid comprehensive insurance",
        required: true,
      },
      {
        key: "policeVerification",
        title: "Police Verification Certificate",
        description: "Background verification from local police",
        required: true,
      },
      {
        key: "medicalCertificate",
        title: "Medical Fitness Certificate",
        description: "Health fitness certificate",
        required: true,
      },
    ];

    return (
      <View style={styles.stepContent}>
        <Text
          style={[
            styles.stepTitle,
            { color: isDarkMode ? "#FFFFFF" : "#000000" },
          ]}
        >
          Document Upload
        </Text>
        <Text
          style={[
            styles.stepDescription,
            { color: isDarkMode ? "#CCCCCC" : "#666666" },
          ]}
        >
          Please upload clear photos of all required documents.
        </Text>

        <View style={styles.documentsSection}>
          {documents.map((doc, index) => (
            <View
              key={doc.key}
              style={[
                styles.documentCard,
                { backgroundColor: isDarkMode ? "#1A1A1A" : "#F9FAFB" },
              ]}
            >
              <View style={styles.documentHeader}>
                <View style={styles.documentInfo}>
                  <Text
                    style={[
                      styles.documentTitle,
                      { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                  >
                    {doc.title}
                    {doc.required && <Text style={styles.required}> *</Text>}
                  </Text>
                  <Text
                    style={[
                      styles.documentDescription,
                      { color: isDarkMode ? "#CCCCCC" : "#666666" },
                    ]}
                  >
                    {doc.description}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    { borderColor: isDarkMode ? "#333333" : "#E5E7EB" },
                  ]}
                  onPress={() => handleDocumentUpload(doc.title)}
                >
                  <Upload
                    size={20}
                    color={isDarkMode ? "#CCCCCC" : "#666666"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.warningCard,
            { backgroundColor: isDarkMode ? "#1A1A1A" : "#FEF3C7" },
          ]}
        >
          <AlertTriangle size={20} color="#F59E0B" />
          <Text
            style={[
              styles.warningText,
              { color: isDarkMode ? "#F59E0B" : "#92400E" },
            ]}
          >
            All documents will be verified by our team. Please ensure all
            documents are valid and clearly visible.
          </Text>
        </View>
      </View>
    );
  };

  const renderTrainingStep = () => (
    <View style={styles.stepContent}>
      <Text
        style={[
          styles.stepTitle,
          { color: isDarkMode ? "#FFFFFF" : "#000000" },
        ]}
      >
        Safety Training
      </Text>
      <Text
        style={[
          styles.stepDescription,
          { color: isDarkMode ? "#CCCCCC" : "#666666" },
        ]}
      >
        Complete our mandatory safety training program.
      </Text>

      <View style={styles.trainingModules}>
        {[
          {
            title: "Student Safety Guidelines",
            duration: "15 mins",
            description: "Learn how to ensure student safety during rides",
          },
          {
            title: "App Usage Training",
            duration: "10 mins",
            description: "How to use the driver app effectively",
          },
          {
            title: "Emergency Procedures",
            duration: "20 mins",
            description: "What to do in emergency situations",
          },
          {
            title: "Route Familiarization",
            duration: "25 mins",
            description: "Popular routes between LNMIIT and city areas",
          },
        ].map((module, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.trainingModule,
              { backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF" },
            ]}
            onPress={() => Alert.alert("Training", `Starting ${module.title}`)}
          >
            <View style={styles.moduleContent}>
              <View style={styles.moduleInfo}>
                <Text
                  style={[
                    styles.moduleTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  {module.title}
                </Text>
                <Text
                  style={[
                    styles.moduleDescription,
                    { color: isDarkMode ? "#CCCCCC" : "#666666" },
                  ]}
                >
                  {module.description}
                </Text>
              </View>
              <View style={styles.moduleRight}>
                <View style={styles.duration}>
                  <Clock size={14} color={isDarkMode ? "#CCCCCC" : "#666666"} />
                  <Text
                    style={[
                      styles.durationText,
                      { color: isDarkMode ? "#CCCCCC" : "#666666" },
                    ]}
                  >
                    {module.duration}
                  </Text>
                </View>
                <ArrowRight
                  size={20}
                  color={isDarkMode ? "#CCCCCC" : "#666666"}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View
        style={[
          styles.quizCard,
          { backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF" },
        ]}
      >
        <Text
          style={[
            styles.quizTitle,
            { color: isDarkMode ? "#FFFFFF" : "#000000" },
          ]}
        >
          Safety Quiz
        </Text>
        <Text
          style={[
            styles.quizDescription,
            { color: isDarkMode ? "#CCCCCC" : "#666666" },
          ]}
        >
          Pass the safety quiz with minimum 80% score to complete training.
        </Text>
        <Button
          title="Take Quiz"
          onPress={() => Alert.alert("Quiz", "Starting safety quiz...")}
          variant="outline"
          style={styles.quizButton}
        />
      </View>
    </View>
  );

  const renderVerificationStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.verificationContent}>
        <Shield size={80} color="#10B981" />
        <Text
          style={[
            styles.verificationTitle,
            { color: isDarkMode ? "#FFFFFF" : "#000000" },
          ]}
        >
          Verification in Progress
        </Text>
        <Text
          style={[
            styles.verificationDescription,
            { color: isDarkMode ? "#CCCCCC" : "#666666" },
          ]}
        >
          Your application has been submitted successfully. Our team will verify
          your documents and background within 2-3 business days.
        </Text>

        <View style={styles.verificationSteps}>
          {[
            "Document verification",
            "Background check",
            "Reference verification",
            "Final approval",
          ].map((step, index) => (
            <View key={index} style={styles.verificationStep}>
              <CheckCircle size={16} color="#10B981" />
              <Text
                style={[
                  styles.verificationStepText,
                  { color: isDarkMode ? "#CCCCCC" : "#666666" },
                ]}
              >
                {step}
              </Text>
            </View>
          ))}
        </View>

        <Text
          style={[
            styles.contactInfo,
            { color: isDarkMode ? "#CCCCCC" : "#666666" },
          ]}
        >
          You will receive updates via SMS and email. For any queries, contact
          us at +91 98765 43210
        </Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalInfoStep();
      case 1:
        return renderVehicleInfoStep();
      case 2:
        return renderDocumentsStep();
      case 3:
        return renderTrainingStep();
      case 4:
        return renderVerificationStep();
      default:
        return renderPersonalInfoStep();
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#000000" : "#F5F5F5" },
      ]}
    >
      {renderProgressHeader()}
      {renderStepIndicators()}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderStepContent()}
      </ScrollView>

      <View
        style={[
          styles.buttonContainer,
          { backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF" },
        ]}
      >
        {currentStep > 0 && (
          <Button
            title="Back"
            onPress={handleBack}
            variant="outline"
            style={styles.backButton}
          />
        )}
        <Button
          title={currentStep === steps.length - 1 ? "Complete" : "Next"}
          onPress={handleNext}
          style={styles.nextButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  progressContent: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  progressSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  stepIndicators: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: "space-between",
  },
  stepIndicator: {
    alignItems: "center",
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 10,
    textAlign: "center",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  formSection: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 24,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  documentsSection: {
    gap: 16,
  },
  documentCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  documentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  documentInfo: {
    flex: 1,
    marginRight: 12,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  required: {
    color: "#EF4444",
  },
  documentDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  uploadButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  warningText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  trainingModules: {
    gap: 12,
  },
  trainingModule: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  moduleContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moduleInfo: {
    flex: 1,
    marginRight: 12,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  moduleDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  moduleRight: {
    alignItems: "flex-end",
  },
  duration: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  durationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  quizCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    marginTop: 20,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  quizDescription: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  quizButton: {
    minWidth: 120,
  },
  verificationContent: {
    alignItems: "center",
    paddingVertical: 40,
  },
  verificationTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
  },
  verificationDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  verificationSteps: {
    alignSelf: "stretch",
    gap: 12,
    marginBottom: 30,
  },
  verificationStep: {
    flexDirection: "row",
    alignItems: "center",
  },
  verificationStepText: {
    fontSize: 16,
    marginLeft: 12,
  },
  contactInfo: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    gap: 12,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});

export default DriverOnboarding;
