import mongoose, { Schema, Document, models, Model } from 'mongoose';

// Define interfaces for content sections
export interface ITeamMember {
  name: string;
  position: string;
  photoPath: string;
  order: number;
}

export interface ITestimonial {
  name: string;
  location: string;
  quote: string;
  photoPath: string;
}

export interface IDestination {
  name: string;
  imagePath: string;
  homestayCount: number;
}

export interface IFeature {
  icon: string;
  title: string;
  description: string;
}

export interface ISocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface INavLink {
  name: string;
  path: string;
  order: number;
}

export interface IImpactStat {
  value: string;
  label: string;
}

export interface IWebContent extends Document {
  adminUsername: string;
  
  // Site-wide content
  siteInfo: {
    siteName: string;
    tagline: string;
    logoPath: string;
    faviconPath: string;
  };
  
  // Navbar
  navigation: {
    links: INavLink[];
  };
  
  // Footer
  footer: {
    description: string;
    quickLinks: INavLink[];
    hostLinks: INavLink[];
    contactInfo: {
      address: string;
      email: string;
      phone: string;
      workingHours: string;
    };
    socialLinks: ISocialLink[];
    copyright: string;
    policyLinks: INavLink[];
  };
  
  // Home Page
  homePage: {
    hero: {
      title: string;
      subtitle: string;
      backgroundImage: string;
      searchPlaceholder: string;
    };
    stats: IImpactStat[];
    howItWorks: {
      title: string;
      subtitle: string;
      steps: {
        icon: string;
        title: string;
        description: string;
        linkText: string;
        linkUrl: string;
      }[];
    };
    destinations: {
      title: string;
      subtitle: string;
      items: IDestination[];
      viewAllLink: string;
    };
    join: {
      title: string;
      description: string;
      features: {
        icon: string;
        title: string;
        description: string;
      }[];
      backgroundImage: string;
    };
    cta: {
      title: string;
      subtitle: string;
      backgroundImage: string;
      primaryButton: {
        text: string;
        link: string;
      };
      secondaryButton: {
        text: string;
        link: string;
      };
    };
  };
  
  // About Page
  aboutPage: {
    hero: {
      title: string;
      subtitle: string;
      backgroundImage: string;
    };
    story: {
      title: string;
      content: string;
      imagePath: string;
    };
    values: {
      title: string;
      subtitle: string;
      items: IFeature[];
    };
    team: {
      title: string;
      subtitle: string;
      members: ITeamMember[];
    };
    offerings: {
      title: string;
      subtitle: string;
      features: IFeature[];
    };
    impact: {
      title: string;
      content: string;
      stats: string[];
      imagePath: string;
    };
    mission: {
      statement: string;
    };
    cta: {
      title: string;
      subtitle: string;
      primaryButton: {
        text: string;
        link: string;
      };
      secondaryButton: {
        text: string;
        link: string;
      };
    };
  };
  
  // Contact Page
  contactPage: {
    hero: {
      title: string;
      subtitle: string;
      backgroundImage: string;
    };
    form: {
      title: string;
      nameLabel: string;
      emailLabel: string;
      subjectLabel: string;
      messageLabel: string;
      submitButtonText: string;
      subjects: string[];
    };
    info: {
      title: string;
      location: {
        title: string;
        address: string;
      };
      email: {
        title: string;
        general: string;
        support: string;
      };
      phone: {
        title: string;
        office: string;
        support: string;
      };
      hours: {
        title: string;
        schedule: string;
      };
    };
    map: {
      imagePath: string;
      markerText: string;
    };
  };
  
  // Testimonials
  testimonials: ITestimonial[];
  
  // Last updated timestamp
  updatedAt: Date;
  createdAt: Date;
}

// Define schema
const webContentSchema = new Schema<IWebContent>({
  adminUsername: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Site-wide content
  siteInfo: {
    siteName: { type: String, required: true, default: "Nepal StayLink" },
    tagline: { type: String, required: true, default: "Your Gateway to Authentic Homestays" },
    logoPath: { type: String, required: true, default: "/Logo.png" },
    faviconPath: { type: String, default: "/favicon.ico" }
  },
  
  // Navbar
  navigation: {
    links: [{
      name: { type: String, required: true },
      path: { type: String, required: true },
      order: { type: Number, required: true }
    }]
  },
  
  // Footer
  footer: {
    description: { type: String, required: true },
    quickLinks: [{
      name: { type: String, required: true },
      path: { type: String, required: true },
      order: { type: Number, required: true }
    }],
    hostLinks: [{
      name: { type: String, required: true },
      path: { type: String, required: true },
      order: { type: Number, required: true }
    }],
    contactInfo: {
      address: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      workingHours: { type: String, required: true }
    },
    socialLinks: [{
      platform: { type: String, required: true },
      url: { type: String, required: true },
      icon: { type: String, required: true }
    }],
    copyright: { type: String, required: true },
    policyLinks: [{
      name: { type: String, required: true },
      path: { type: String, required: true },
      order: { type: Number, required: true }
    }]
  },
  
  // Home Page
  homePage: {
    hero: {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      backgroundImage: { type: String, required: true },
      searchPlaceholder: { type: String, required: true }
    },
    stats: [{
      value: { type: String, required: true },
      label: { type: String, required: true }
    }],
    howItWorks: {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      steps: [{
        icon: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        linkText: { type: String, required: true },
        linkUrl: { type: String, required: true }
      }]
    },
    destinations: {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      items: [{
        name: { type: String, required: true },
        imagePath: { type: String, required: true },
        homestayCount: { type: Number, required: true }
      }],
      viewAllLink: { type: String, required: true }
    },
    join: {
      title: { type: String, required: true },
      description: { type: String, required: true },
      features: [{
        icon: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true }
      }],
      backgroundImage: { type: String, required: true }
    },
    cta: {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      backgroundImage: { type: String, required: true },
      primaryButton: {
        text: { type: String, required: true },
        link: { type: String, required: true }
      },
      secondaryButton: {
        text: { type: String, required: true },
        link: { type: String, required: true }
      }
    }
  },
  
  // About Page
  aboutPage: {
    hero: {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      backgroundImage: { type: String, required: true }
    },
    story: {
      title: { type: String, required: true },
      content: { type: String, required: true },
      imagePath: { type: String, required: true }
    },
    values: {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      items: [{
        icon: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true }
      }]
    },
    team: {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      members: [{
        name: { type: String, required: true },
        position: { type: String, required: true },
        photoPath: { type: String, required: true },
        order: { type: Number, required: true }
      }]
    },
    offerings: {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      features: [{
        icon: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, required: true }
      }]
    },
    impact: {
      title: { type: String, required: true },
      content: { type: String, required: true },
      stats: [{ type: String, required: true }],
      imagePath: { type: String, required: true }
    },
    mission: {
      statement: { type: String, required: true }
    },
    cta: {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      primaryButton: {
        text: { type: String, required: true },
        link: { type: String, required: true }
      },
      secondaryButton: {
        text: { type: String, required: true },
        link: { type: String, required: true }
      }
    }
  },
  
  // Contact Page
  contactPage: {
    hero: {
      title: { type: String, required: true },
      subtitle: { type: String, required: true },
      backgroundImage: { type: String, required: true }
    },
    form: {
      title: { type: String, required: true },
      nameLabel: { type: String, required: true },
      emailLabel: { type: String, required: true },
      subjectLabel: { type: String, required: true },
      messageLabel: { type: String, required: true },
      submitButtonText: { type: String, required: true },
      subjects: [{ type: String, required: true }]
    },
    info: {
      title: { type: String, required: true },
      location: {
        title: { type: String, required: true },
        address: { type: String, required: true }
      },
      email: {
        title: { type: String, required: true },
        general: { type: String, required: true },
        support: { type: String, required: true }
      },
      phone: {
        title: { type: String, required: true },
        office: { type: String, required: true },
        support: { type: String, required: true }
      },
      hours: {
        title: { type: String, required: true },
        schedule: { type: String, required: true }
      }
    },
    map: {
      imagePath: { type: String, required: true },
      markerText: { type: String, required: true }
    }
  },
  
  // Testimonials
  testimonials: [{
    name: { type: String, required: true },
    location: { type: String, required: true },
    quote: { type: String, required: true },
    photoPath: { type: String, required: true }
  }]
}, {
  timestamps: true,
  collection: 'WebContent'
});

// Create or retrieve the model
const WebContent = (models?.WebContent as Model<IWebContent>) || 
  mongoose.model<IWebContent>('WebContent', webContentSchema);

export default WebContent; 