import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import "../../styles/components/HelpModal.css";

/**
 * HelpModal component for displaying help information in a modal.
 *
 * @param {Object} props - The props passed to the HelpModal component.
 * @param {boolean} props.show - Whether the modal should be shown.
 * @param {Function} props.onClose - Function to call when the modal is closed.
 */
function HelpModal({ show, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (show) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready before starting animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      setIsVisible(false);
      // Wait for animation to finish before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 1000); // Match this with the CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!shouldRender) return null;

  /**
   * getModalContent function returns the content for the help modal based on the current pathname.
   *
   * @returns {Object} - An object containing the title and content for the help modal.
   */
  const getModalContent = () => {
    switch (location.pathname) {
      case "/radar":
        return {
          title: "Tech Radar Help",
          content: (
            <div className="help-modal-body">
              <h5>Guide</h5>
              <span>
                The Tech Radar is a visual representation of our technology
                landscape. Here&apos;s how to use it:
              </span>
              <ul className="help-modal-list">
                <li>
                  Click on any point on the Radar to see detailed information
                  about that technology
                </li>
                <li>
                  A box will fill with information about the technology and
                  relating projects
                </li>
                <li>
                  Click on the project to see more information about that
                  project
                </li>
                <li>
                  Use the search bar to find specific technologies on the Radar
                </li>
                <li>
                  Click the quadrant label on the Radar to filter the Radar to that specific quadrant
                </li>
              </ul>
              <h5>Quadrants and Rings</h5>
              <ul className="help-modal-list">
                <li>
                  The 4 quadrants are:
                  <ul className="help-modal-sublist">
                    <li>
                      <strong>Languages:</strong> such as Python, JavaScript,
                      Java
                    </li>
                    <li>
                      <strong>Frameworks:</strong> such as Flask, React, Spring
                    </li>
                    <li>
                      <strong>Supporting Tools:</strong> such as CI/CD (e.g.
                      Jenkins, GitHub Actions, Concourse) and other tools used
                      for development, documentation and project management
                      (e.g. VSCode, Confluence, Jira)
                    </li>
                    <li>
                      <strong>Infrastructure:</strong> such as AWS, Azure, GCP
                    </li>
                  </ul>
                </li>
                <li>
                  The 4 rings show what ONS wants to do with that technology:
                  <ul className="help-modal-sublist">
                    <li>
                      <strong>Adopt:</strong> aim to widely adopt and mature
                    </li>
                    <li>
                      <strong>Trial:</strong> aim to try out and evaluate
                    </li>
                    <li>
                      <strong>Assess:</strong> aim to assess for potential
                      adoption
                    </li>
                    <li>
                      <strong>Hold:</strong> not recommended for new deployment
                      without approval
                    </li>
                  </ul>
                </li>
              </ul>
            </div>
          ),
        };
      case "/":
        return {
          title: "Digital Landscape Help",
          content: (
            <div className="help-modal-body">
              <h5>Overview</h5>
              <span>
                Welcome to the Digital Landscape - your overview of our digital
                technology ecosystem.
              </span>
              <ul className="help-modal-list">
                <li>Browse through different technology categories</li>
                <li>See trending technologies and recent changes</li>
                <li>Access detailed statistics and reports</li>
              </ul>
            </div>
          ),
        };
      case "/statistics":
        return {
          title: "Statistics Help",
          content: (
            <div className="help-modal-body">
              <h5>Guide</h5>
              <span>
                The Statistics page is a visual representation of the languages
                used in the ONSDigital GitHub Organisation. Here&apos;s how to
                use it:
              </span>
              <ul className="help-modal-list">
                <li>
                  Select a date range to see the statistics and languages used
                  in that time period (default is all time).
                </li>
                <li>
                  Select a status to see the statistics and languages used in
                  that status (default is active).
                </li>
                <li>
                  Choose from the 5 filters below Language Statistics to sort
                  the languages by name, most/least repos, lines and usage or
                  Tech Radar languages only.
                </li>
                <li>
                  Use the search bar to find specific languages on the page.
                </li>
                <li>
                  Hovering over any language will adjust the &quot;Total
                  Repositories&quot; card to show a percentage.
                </li>
                <li>
                  Click on a language that is highlighted by a Tech Radar ring
                  colour to be directed to the Tech Radar page for that
                  language.
                </li>
              </ul>
            </div>
          ),
        };
      case "/projects":
        return {
          title: "Projects Help",
          content: (
            <div className="help-modal-body">
              <h5>Guide</h5>
              <span>
                The Projects page is a visual representation of the projects in
                ONS. Here&apos;s how to use it:
              </span>
              <ul className="help-modal-list">
                <li>
                  View the list of projects. The bar to the right of the project
                  list shows the number of technologies listed in the project.
                </li>
                <li>
                  Click on a project to view the technologies listed in the
                  project.
                </li>
                <li>
                  Use the search bar to find specific projects on the page.
                </li>
                <li>
                  Click &quot;Sort By&quot; to sort the projects by name,
                  most/least technologies or technology status. The technology
                  status calculates the highest/least percentage of the ring of
                  technologies in the project.
                </li>
                <li>Click refresh to fetch the latest data.</li>
              </ul>
            </div>
          ),
        };
      case "/review/dashboard":
        return {
          title: "Review Dashboard",
          content: (
            <div className="help-modal-body">
              <h5>Guide</h5>
              <span>
                This page should only be used by reviewers. Here is how to use
                it:{" "}
              </span>
              <ul className="help-modal-list">
                <li>
                  View respective rings as boxes, with the technology
                  categorised by quadrants.
                </li>
                <li>
                  Click on a technology and the timeline box will fill at the
                  top of the page.
                </li>
                <li>
                  Within the timeline box, you can click the edit button which
                  allows you to change the technology name and the category.
                </li>
                <li>
                  Click the tick button bring up a modal to show your changes
                  and confirm. These changes are irreversible.
                </li>
                <li>
                  You can drag a technology from one box to another. This will
                  update the timeline and ring of the technology.
                </li>
                <li>
                  To confirm your changes, press the &quot;Save Changes&quot; at
                  the bottom of the page.
                </li>
                <li>
                  You can add a technology by entering the new technology in the
                  &quot;Add Technology&quot; box, then selecting the category
                  and pressing &quot;Add Technology&quot;.
                </li>
              </ul>
            </div>
          ),
        };
      default:
        return {
          title: "Help",
          content: (
            <div className="help-modal-body">
              <span>
                Welcome to our platform. Use the navigation menu to explore
                different sections.
              </span>
            </div>
          ),
        };
    }
  };

  const modalContent = getModalContent();

  return (
    <div
      className={`help-modal-overlay ${isVisible ? "show" : ""}`}
      onClick={onClose}
    >
      <div className="help-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="help-modal-header">
          <h2 className="help-modal-title">{modalContent.title}</h2>
          <button className="help-modal-close" onClick={onClose}>
            <IoClose size={20} />
          </button>
        </div>
        {modalContent.content}
      </div>
    </div>
  );
}

export default HelpModal;
