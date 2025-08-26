// pages/team.jsx
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Team() {
    const router = useRouter();
    
  const teamMembers = [
    {
      name: "Harsh Singwi",
      role: "Leader",
      image: "/images/harsh.jpeg",
      about:
        "Third-Year B.Tech IT student with proven expertise in full-stack development, API development, and machine learning. Experienced in building scalable applications using Django, and React with strong backend development skills and cloud technologies.",
      linkdin: "https://www.linkedin.com/in/harsh-singwi-53a6b32b0",
    },
    {
      name: "Rishi Goyal",
      role: "Developer",
      image: "/images/rishi.jpeg",
      about: "Loves building innovative solutions.",
      linkdin: "https://www.linkedin.com/in/rishi-goyal111",
    },
    {
      name: "Sanaya Parmar",
      role: "Developer",
      image: "/images/sanaya.jpeg",
      about:
        "I am a tech-driven student passionate about software development, web technologies, and AI,, with a strong focus on accuracy and problem-solving. I enjoy exploring new tools, building practical projects, and continuously refining my skills to deliver reliable and effective solutions",
      linkdin: "https://www.linkedin.com/in/sanaya-parmar-b37588229/",
    },
    {
      name: "Aastha Kataria",
      role: "Developer",
      image: "/images/aastha.jpeg",
      about: "Adept at backend development and database management.",
      linkdin: "https://www.linkedin.com/in/aastha-kataria-b5847426b/",
    },
    {
      name: "Sneha Patil",
      role: "Developer",
      image: "/images/sneha.jpeg",
      about: "A creative designer with a passion for user experience.",
      linkdin: "https://www.linkedin.com/in/sneha-patil/",
    },
    {
      name: "Akanksha",
      role: "Developer",
      image: "/images/akanksha.jpeg",
      about:
        "Final year B.Tech student with a passion for cyber security, cryptographic systems and hands-on threat analysis.",
      linkdin: "https://www.linkedin.com/in/akanksha-mishra-b032652a9/",
    },
  ];

  const faculty = {
    name: "Prof. Jugal Manek",
    role: "Faculty Mentor",
    image: "/images/jugal.jpeg",
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-6 font-sans">
      <h1 className="text-4xl font-bold text-center text-blue-700 mb-12">
        Meet Our Team
      </h1>

      {/* Team Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
        {teamMembers.map((member, index) => (
          <div
            key={index}
            className="relative w-80 h-[450px] mx-auto [perspective:1000px]"
          >
            <div className="relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] hover:[transform:rotateY(180deg)]">
              {/* Front */}
              <div className="absolute inset-0 bg-white border-2 border-blue-500 rounded-xl overflow-hidden [backface-visibility:hidden]">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-blue-700 to-transparent p-4 text-white">
                  <h2 className="text-lg font-bold">{member.name}</h2>
                  <p className="text-sm">{member.role}</p>
                </div>
              </div>

              {/* Back */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-white border-2 border-blue-500 rounded-xl p-4 text-center [transform:rotateY(180deg)] [backface-visibility:hidden] flex flex-col justify-center">
                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                  {member.name}
                </h3>
                <p className="text-sm text-gray-700 mb-3">{member.about}</p>

                <a
                  href={member.linkdin}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-semibold hover:underline"
                >
                  LinkedIn →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Faculty Section (Static card, no flip) */}
      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-blue-600 mb-6">
          Faculty Mentor
        </h2>
        <div className="max-w-sm mx-auto bg-white border-2 border-blue-500 rounded-xl shadow-lg overflow-hidden">
          <img
            src={faculty.image}
            alt={faculty.name}
            className="w-full h-72 object-cover"
          />
          <div className="bg-blue-700 text-white p-4">
            <h3 className="text-lg font-bold">{faculty.name}</h3>
            <p>{faculty.role}</p>
          </div>
          
        </div>
      </div>
      <button
  onClick={() => router.push("/")}
  className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700"
>
  ⬅ Back to Home
</button>

    </div>
  );
}
