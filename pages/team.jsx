import React from "react";

export default function Team() {
  const handleBackToHome = () => {
    // Replace with your actual navigation logic
    window.location.href = "/";
  };

  const teamMembers = [
    {
      name: "Harsh Singwi",
      role: "Leader",
      image: "/images/harsh.jpeg",
      about:
        "Third-Year B.Tech IT student with proven expertise in full-stack development, API development, and machine learning. Experienced in building scalable applications using Django, and React with strong backend development skills and cloud technologies.",
      linkdin: "https://www.linkedin.com/in/harsh-singwi-53a6b32b0",
      email: "harsh.singwi@somaiya.edu",
    },
    {
      name: "Rishi Goyal",
      role: "Developer",
      image: "/images/rishi.jpeg",
      about: "Passionate about building innovative solutions and exploring cutting-edge technologies. Specializes in problem-solving with a continuous learning mindset and strong foundation in modern development practices.",
      linkdin: "https://www.linkedin.com/in/rishi-goyal111",
      email: "rishi.goyal@somaiya.edu",
    },
    {
      name: "Sanaya Parmar",
      role: "Developer",
      image: "/images/sanaya.jpeg",
      about:
        "Tech-driven student passionate about software development, web technologies, and AI, with a strong focus on accuracy and problem-solving. Enjoys exploring new tools, building practical projects, and continuously refining skills to deliver reliable and effective solutions.",
      linkdin: "https://www.linkedin.com/in/sanaya-parmar-b37588229/",
      email: "sanaya.p@somaiya.edu",
    },
    {
      name: "Aastha Kataria",
      role: "Developer",
      image: "/images/aastha.jpeg",
      about: "Adept at backend development and database management with a keen eye for detail and accuracy. Combines technical expertise with creative design skills for user-friendly interface development.",
      linkdin: "https://www.linkedin.com/in/aastha-kataria-b5847426b/",
      email: "aastha.k@somaiya.edu",
    },
    {
      name: "Sneha Patil",
      role: "Developer",
      image: "/images/sneha.jpeg",
      about: "Full-Stack Developer skilled in React, Node.js, and cloud technologies.Experienced in building scalable web applications and AI-powered systems with a focus on usability and modular design.Proven ability to deliver impactful projects across diverse domains by combining technical expertise with user-centric thinking.",
      linkdin: "https://www.linkedin.com/in/5neha-patil/",
      email: "patil.sr@somaiya.edu",
    },
    {
      name: "Akanksha",
      role: "Developer",
      image: "/images/akanksha.jpeg",
      about:
        "Final year B.Tech student specializing in cyber security, cryptographic systems and hands-on threat analysis. Expert in network security, ethical hacking, and risk assessment with strong programming foundation.",
      linkdin: "https://www.linkedin.com/in/akanksha-mishra-b032652a9/",
      email: "akanksha.r@somaiya.edu",
    },
  ];

  const faculty = {
    name: "Prof. Jugal Manek",
    role: "Faculty Mentor",
    image: "/images/jugalsir.jpeg",
    about: "Professor at KJ Somaiya College of Engineering in the Information Technology Department. Expert in software engineering and project guidance with years of experience in mentoring students and leading innovative projects.",
    email: "jugal@somaiya.edu",
    linkdin: "https://www.linkedin.com/in/jugal-jeetendra-manek/",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-16 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <button
            onClick={handleBackToHome}
            className="inline-flex items-center text-blue-100 hover:text-white mb-8 transition-all duration-200 bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm border border-white/20 hover:bg-white/20"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
          <h1 className="text-6xl font-bold mb-6 leading-tight">Part V: Meet the Team</h1>
          <p className="text-blue-100 text-xl max-w-4xl leading-relaxed">
            The talented individuals behind our Virtual Lab project. Each member brings unique skills and perspectives to create something extraordinary.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Faculty Mentor Section */}
        <section className="mb-24">
          <div className="flex items-center mb-12">
            <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full mr-6"></div>
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-2">Faculty Mentor</h2>
              <p className="text-gray-600 text-lg">Project guidance and academic supervision</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-1/3 lg:w-1/4">
                <img
                  src={faculty.image}
                  alt={faculty.name}
                  className="w-full h-64 md:h-80 object-cover"
                />
              </div>
              <div className="flex-1 p-8 lg:p-10 bg-gradient-to-br from-blue-50/50 to-slate-50">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 mb-3">{faculty.name}</h3>
                    <p className="text-blue-700 font-semibold text-lg">{faculty.role}</p>
                  </div>
                  <span className="inline-block px-4 py-2 text-sm font-bold text-orange-700 bg-orange-100 rounded-full border-2 border-orange-200">
                    MENTOR
                  </span>
                </div>
                <p className="text-gray-700 mb-8 leading-relaxed text-lg">{faculty.about}</p>
                <div className="flex flex-wrap gap-4">
                  <a
                    href={faculty.linkdin}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:transform hover:scale-105"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"/>
                    </svg>
                    LinkedIn Profile
                  </a>
                  <div className="inline-flex items-center text-gray-600 font-semibold bg-gray-100 px-6 py-3 rounded-xl border border-gray-200">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {faculty.email}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Development Team Section */}
        <section>
          <div className="flex items-center mb-12">
            <div className="w-16 h-1 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full mr-6"></div>
            <div>
              <h2 className="text-4xl font-bold text-gray-800 mb-2">Development Team</h2>
              <p className="text-gray-600 text-lg">Student developers and project contributors</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:transform hover:scale-[1.02]"
              >
                <div className="flex">
                  <div className="w-52 h-64 flex-shrink-0">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 p-7 bg-gradient-to-br from-blue-50/50 to-slate-50 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{member.name}</h3>
                        <p className="text-blue-700 font-semibold text-lg">{member.role}</p>
                      </div>
                      <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border-2 ${
                        member.role === 'Leader' 
                          ? 'text-blue-700 bg-blue-100 border-blue-200' 
                          : 'text-blue-700 bg-blue-100 border-blue-200'
                      }`}>
                        {member.role.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-6 flex-grow text-sm">
                      {member.about}
                    </p>
                    <div className="flex flex-col gap-3 mt-auto">
                      <a
                        href={member.linkdin}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-all duration-200 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"/>
                        </svg>
                        LinkedIn
                      </a>
                      <div className="inline-flex items-center text-gray-600 font-semibold bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {member.email}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="bg-gradient-to-r from-blue-100 to-slate-100 border-t-4 border-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Virtual Lab Project Team</h3>
            <p className="text-gray-700 text-lg font-semibold">KJ Somaiya College of Engineering</p>
          </div>
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-4 rounded-full"></div>
          <p className="text-gray-600 text-lg">
            Innovating the future of virtual laboratory experiences • 2024
          </p>
        </div>
      </div>
    </div>
  );
}