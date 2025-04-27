"use client";

import { useState } from "react";
import Image from "next/image";
import { Mail, Phone, MapPin, Send, Clock } from "lucide-react";
import { useWebContent } from "@/context/WebContentContext";

export default function Contact() {
  const { content, loading } = useWebContent();
  
  // Use default content if still loading or content not available
  const contactContent = loading || !content?.contactPage
    ? {
        hero: {
          title: "Contact Us",
          subtitle: "Have questions or feedback? We'd love to hear from you. Reach out to our team using the contact information below.",
          backgroundImage: "/images/contact/contact-map.jpg"
        },
        form: {
          title: "Send Us a Message",
          nameLabel: "Your Name *",
          emailLabel: "Your Email *",
          subjectLabel: "Subject *",
          messageLabel: "Your Message *",
          submitButtonText: "Send Message",
          subjects: [
            "General Inquiry",
            "Homestay Listing",
            "Booking Help",
            "Partnership Opportunity",
            "Technical Support",
            "Feedback"
          ]
        },
        info: {
          title: "Get In Touch",
          location: {
            title: "Our Location",
            address: "Thamel, Kathmandu 44600, Nepal"
          },
          email: {
            title: "Email Us",
            general: "info@nepalstaylink.com",
            support: "support@nepalstaylink.com"
          },
          phone: {
            title: "Call Us",
            office: "+977 1 4123456",
            support: "+977 1 4123457"
          },
          hours: {
            title: "Working Hours",
            schedule: "Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed"
          }
        },
        map: {
          imagePath: "/images/contact/nepal-map.jpg",
          markerText: "Nepal StayLink Headquarters"
        }
      }
    : content.contactPage;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    status: "success" | "error" | null;
    message: string;
  }>({
    status: null,
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    try {
      // In a real application, you would send this data to your backend
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setSubmitStatus({
        status: "success",
        message: "Thank you! Your message has been sent successfully.",
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      
    } catch (error) {
      setSubmitStatus({
        status: "error",
        message: "Oops! Something went wrong. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <Image
            src={contactContent.hero.backgroundImage}
            alt="Nepal Map"
            fill
            className="object-cover"
          />
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
              {contactContent.hero.title}
            </h1>
            <div className="w-16 h-1 bg-gray-300 mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {contactContent.hero.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info & Form Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Contact Form */}
              <div className="p-8 md:p-12">
                <h2 className="text-2xl font-bold mb-8 text-gray-900">{contactContent.form.title}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      {contactContent.form.nameLabel}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      {contactContent.form.emailLabel}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                  
                  {/* Subject Field */}
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                      {contactContent.form.subjectLabel}
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                    >
                      <option value="">Please select a subject</option>
                      {contactContent.form.subjects.map((subject: string, index: number) => (
                        <option key={index} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Message Field */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      {contactContent.form.messageLabel}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>
                  
                  {/* Status Message */}
                  {submitStatus.status && (
                    <div
                      className={`p-4 rounded-lg ${
                        submitStatus.status === "success"
                          ? "bg-green-50 text-green-800 border border-green-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                    >
                      {submitStatus.message}
                    </div>
                  )}
                  
                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full px-6 py-3 bg-gray-900 text-white rounded-lg font-medium transition-all flex items-center justify-center ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-black"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        {contactContent.form.submitButtonText}
                      </>
                    )}
                  </button>
                </form>
              </div>
              
              {/* Contact Information */}
              <div className="bg-gray-50 p-8 md:p-12">
                <h2 className="text-2xl font-bold mb-8 text-gray-900">{contactContent.info.title}</h2>
                
                {/* Contact Cards */}
                <div className="space-y-8">
                  <div className="flex">
                    <div className="bg-white rounded-full p-3 shadow-sm mr-4 flex-shrink-0">
                      <MapPin className="h-6 w-6 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-gray-900">{contactContent.info.location.title}</h3>
                      <p className="text-gray-600">
                        {contactContent.info.location.address}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="bg-white rounded-full p-3 shadow-sm mr-4 flex-shrink-0">
                      <Mail className="h-6 w-6 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-gray-900">{contactContent.info.email.title}</h3>
                      <p className="text-gray-600">
                        General Inquiries: <a href={`mailto:${contactContent.info.email.general}`} className="text-gray-700 hover:text-black hover:underline transition-colors">{contactContent.info.email.general}</a><br />
                        Support: <a href={`mailto:${contactContent.info.email.support}`} className="text-gray-700 hover:text-black hover:underline transition-colors">{contactContent.info.email.support}</a>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="bg-white rounded-full p-3 shadow-sm mr-4 flex-shrink-0">
                      <Phone className="h-6 w-6 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-gray-900">{contactContent.info.phone.title}</h3>
                      <p className="text-gray-600">
                        Office: <a href={`tel:${contactContent.info.phone.office}`} className="text-gray-700 hover:text-black hover:underline transition-colors">{contactContent.info.phone.office}</a><br />
                        Support: <a href={`tel:${contactContent.info.phone.support}`} className="text-gray-700 hover:text-black hover:underline transition-colors">{contactContent.info.phone.support}</a>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="bg-white rounded-full p-3 shadow-sm mr-4 flex-shrink-0">
                      <Clock className="h-6 w-6 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-gray-900">{contactContent.info.hours.title}</h3>
                      <p className="text-gray-600 whitespace-pre-line">
                        {contactContent.info.hours.schedule}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Map Section */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl overflow-hidden shadow-sm h-[500px] relative border border-gray-100">
            <Image
              src={contactContent.map.imagePath}
              alt="Nepal Map"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white px-6 py-4 rounded-lg shadow-lg text-gray-900 font-medium flex items-center">
                <MapPin className="h-5 w-5 text-gray-700 mr-2" />
                <span>{contactContent.map.markerText}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 