-- AI Seed Data

INSERT INTO subjects (id, name, course_code) VALUES 
('ai', 'Artificial Intelligence', 'BAD402');

-- Store subject ID and create module IDs
DO $$
DECLARE
    v_ai_id TEXT := 'ai';
    v_mod1_id UUID := gen_random_uuid();
    v_mod2_id UUID := gen_random_uuid();
    v_mod3_id UUID := gen_random_uuid();
    v_mod4_id UUID := gen_random_uuid();
    v_mod5_id UUID := gen_random_uuid();
BEGIN
    INSERT INTO modules (id, subject_id, module_number, title, description) VALUES
    (v_mod1_id, v_ai_id, 1, 'Introduction to AI and Intelligent Agents', 'Philosophical, historical, and structural foundations of artificial intelligence and intelligent agents.'),
    (v_mod2_id, v_ai_id, 2, 'Problem-Solving and Uninformed Search', 'Computational mechanics of state-space exploration and uninformed search strategies.'),
    (v_mod3_id, v_ai_id, 3, 'Informed Search and Logical Agents', 'Heuristic functions, cost-aware systems, and propositional logic as a knowledge representation methodology.'),
    (v_mod4_id, v_ai_id, 4, 'First-Order Logic and Inference Mechanisms', 'Expression of complex relationships through First-Order Logic (FOL) and automation of reasoning via chaining.'),
    (v_mod5_id, v_ai_id, 5, 'Uncertain Knowledge, Probabilistic Reasoning, Expert Systems', 'Nuanced realities of environments governed by stochastic elements, probability theory, Bayes Theorem, and Expert Systems.');

    -- Module 1 Questions
    INSERT INTO questions (module_id, subject_id, question_text, exam_cycles, frequency, course_outcome, topic_tags, sort_order) VALUES
    (v_mod1_id, v_ai_id, 'Define Artificial Intelligence. Explain the foundation of AI in detail.', ARRAY['Jan 2026 (Q1a)', 'July 2024 (Q1a)'], NULL, 'L1, L2 / CO1', ARRAY['Artificial Intelligence Foundation'], 1),
    (v_mod1_id, v_ai_id, 'Explain the historical development of AI, highlighting key milestones and breakthroughs.', ARRAY['Jan 2026 (Q1b)'], NULL, 'L2 / CO1', ARRAY['History of AI'], 2),
    (v_mod1_id, v_ai_id, 'Explain all four different approaches to AI in detail (acting humanly, thinking humanly, thinking rationally, acting rationally).', ARRAY['July 2024 (Q1b)'], NULL, 'L1 / CO1', ARRAY['Approaches to AI'], 3),
    (v_mod1_id, v_ai_id, 'What is AI? List out the applications of AI, state the characteristics of AI problems.', ARRAY['July 2025 (Q2a)'], NULL, 'L1 / CO1', ARRAY['Applications of AI', 'Characteristics of AI'], 4),
    (v_mod1_id, v_ai_id, 'Compare and contrast human intelligence to artificial intelligence with numerous examples and applications.', ARRAY['July 2025 (Q1b)'], NULL, 'L4 / CO1', ARRAY['Human vs Artificial Intelligence'], 5),
    (v_mod1_id, v_ai_id, 'Explain the significance of the Turing Test in AI. What abilities does a computer need to pass the Turing test? Discuss why AI researchers have not focused extensively on passing it.', ARRAY['Jan 2025 (Q1a)'], NULL, 'L2 / CO1', ARRAY['Turing Test'], 6),
    (v_mod1_id, v_ai_id, 'Give PEAS specification for: i) Automated taxi driver ii) Medical diagnostic system.', ARRAY['July 2024 (Q2a)'], NULL, 'L1 / CO1', ARRAY['PEAS'], 7),
    (v_mod1_id, v_ai_id, 'Analyze and discuss PEAS descriptor for the following applications in detail: i) Medical diagnosis system ii) Taxi driver iii) Interactive English tutor iv) Part picking robot v) Refinery controller.', ARRAY['Jan 2025 (Q3b)'], NULL, 'L3 / CO1', ARRAY['PEAS'], 8),
    (v_mod1_id, v_ai_id, 'Explain the following: i) PEAS.', ARRAY['July 2025 (Q1c)'], NULL, 'L2 / CO1', ARRAY['PEAS'], 9),
    (v_mod1_id, v_ai_id, 'Briefly explain the properties of Task Environment.', ARRAY['Jan 2026 (Q2a)'], NULL, 'L2 / CO1', ARRAY['Task Environment Properties'], 10),
    (v_mod1_id, v_ai_id, 'Differentiation: i) Fully observable vs partially observable ii) Single agent vs Multiagent iii) Deterministic vs stochastic iv) Static vs Dynamic.', ARRAY['July 2024 (Q2b)'], NULL, 'L1 / CO1', ARRAY['Environment Types'], 11),
    (v_mod1_id, v_ai_id, 'Write the percept sequence for a vacuum cleaner agent and tabulate the workflow of the same with respect to the scenario with location of square A and B.', ARRAY['Jan 2025 (Q2a)'], NULL, 'L3 / CO1', ARRAY['Vacuum Cleaner Agent'], 12),
    (v_mod1_id, v_ai_id, 'Compare simple reflex agents and model-based reflex agents, focusing on their perception processing, decision-making methods, and explain how model-based agents address limitations.', ARRAY['Jan 2025 (Q2a OR)'], NULL, 'L3 / CO1', ARRAY['Simple Reflex Agent', 'Model-based Reflex Agent'], 13),
    (v_mod1_id, v_ai_id, 'Explain the following with respect to structure agents: (i) Simple reflex (ii) Model based reflex (iii) Utility based.', ARRAY['Jan 2026 (Q2b)'], NULL, 'L2 / CO1', ARRAY['Agent Structures'], 14),
    (v_mod1_id, v_ai_id, 'Explain the following: ii) Simple reflex agent iii) Model based agent.', ARRAY['July 2025 (Q1c)'], NULL, 'L2 / CO1', ARRAY['Agent Structures'], 15),
    (v_mod1_id, v_ai_id, 'Explain the structure of agents and analyze the characteristics of intelligent agents.', ARRAY['July 2025 (Q2c)'], NULL, 'L2 / CO1', ARRAY['Agent Structure', 'Intelligent Agents'], 16),
    (v_mod1_id, v_ai_id, 'Analyze and generalize what is a rational agent.', ARRAY['July 2025 (Q2b)'], NULL, 'L4 / CO1', ARRAY['Rational Agent'], 17);

    -- Module 2 Questions
    INSERT INTO questions (module_id, subject_id, question_text, exam_cycles, frequency, course_outcome, topic_tags, sort_order) VALUES
    (v_mod2_id, v_ai_id, 'Explain five components of a well-defined problem. Consider an 8-puzzle problem as an example and explain.', ARRAY['July 2024 (Q3a)'], NULL, 'L2 / CO2', ARRAY['Problem Components', '8-puzzle'], 1),
    (v_mod2_id, v_ai_id, 'What are the four components to define a problem? Define them.', ARRAY['July 2025 (Q1a)'], NULL, 'L1 / CO1', ARRAY['Problem Components'], 2),
    (v_mod2_id, v_ai_id, 'Explain Goal Formulation and Problem Formulation with examples.', ARRAY['Jan 2026 (Q4b)'], NULL, 'L2 / CO2', ARRAY['Goal Formulation', 'Problem Formulation'], 3),
    (v_mod2_id, v_ai_id, 'Explain toy problems and real-world problems in the context of problem-solving approaches with an example for each type in detail.', ARRAY['Jan 2025 (Q4a)'], NULL, 'L2 / CO2', ARRAY['Toy Problems', 'Real-world Problems'], 4),
    (v_mod2_id, v_ai_id, 'Compare and contrast the vacuum world problem and the 8-tile puzzle problems discussing their state representations, initial states, actions and goal tests.', ARRAY['Jan 2025 (Q4b)'], NULL, 'L3 / CO2', ARRAY['Vacuum World', '8-tile Puzzle'], 5),
    (v_mod2_id, v_ai_id, 'You are given two jugs, a 5 liters one and a 4 liters one... How can you get exactly 2 liters of water in the 5 liters jug? Apply water Jug problem algorithm.', ARRAY['July 2025 (Q3a)'], NULL, 'L3 / CO2', ARRAY['Water Jug Problem'], 6),
    (v_mod2_id, v_ai_id, 'Discuss how problem-solving agents interact with their environments.', ARRAY['Jan 2026 (Q3a)'], NULL, 'L2 / CO2', ARRAY['Problem-solving Agents'], 7),
    (v_mod2_id, v_ai_id, 'Explain the components and architecture of a problem-solving agent.', ARRAY['Jan 2025 (Q5a)'], NULL, 'L2 / CO2', ARRAY['Problem-solving Agents'], 8),
    (v_mod2_id, v_ai_id, 'Discuss in detail the Infrastructure for search algorithms.', ARRAY['July 2024 (Q3b)'], NULL, 'L2 / CO2', ARRAY['Search Algorithms Infrastructure'], 9),
    (v_mod2_id, v_ai_id, 'Discuss the different solutions and metrics for searching.', ARRAY['Jan 2026 (Q4a)'], NULL, 'L2 / CO2', ARRAY['Search Metrics'], 10),
    (v_mod2_id, v_ai_id, 'Compare and contrast depth-first search with breadth-first search with examples.', ARRAY['Jan 2025 (Q5b)'], NULL, 'L3 / CO2', ARRAY['DFS', 'BFS'], 11),
    (v_mod2_id, v_ai_id, 'Explain the principles of breadth-first search as a problem solving strategy with an example.', ARRAY['Jan 2026 (Q3b)'], NULL, 'L2 / CO2', ARRAY['BFS'], 12),
    (v_mod2_id, v_ai_id, 'Write an algorithm for Breadth-first search and explain with an example.', ARRAY['July 2024 (Q4a)'], NULL, 'L2 / CO2', ARRAY['BFS'], 13),
    (v_mod2_id, v_ai_id, 'Explain Breadth First Search (BFS) algorithm and apply BFS to find the solution for the above graph. Also find the optimum path and cost.', ARRAY['July 2025 (Q4a)'], NULL, 'L3 / CO2', ARRAY['BFS'], 14),
    (v_mod2_id, v_ai_id, 'Explain Depth first search techniques in detail.', ARRAY['July 2024 (Q4b)'], NULL, 'L2 / CO2', ARRAY['DFS'], 15),
    (v_mod2_id, v_ai_id, 'Describe Depth First Search (DFS) search algorithm with an example.', ARRAY['July 2025 (Q3b)'], NULL, 'L2 / CO2', ARRAY['DFS'], 16),
    (v_mod2_id, v_ai_id, 'Describe the iterative deepening depth first search with an example.', ARRAY['July 2025 (Q4b)'], NULL, 'L2 / CO2', ARRAY['IDDFS'], 17);

    -- Module 3 Questions
    INSERT INTO questions (module_id, subject_id, question_text, exam_cycles, frequency, course_outcome, topic_tags, sort_order) VALUES
    (v_mod3_id, v_ai_id, 'Define informed search strategies in the context of AI. Difference between Informed and Uninformed search strategies.', ARRAY['Jan 2026 (Q5a)'], NULL, 'L2 / CO3', ARRAY['Informed Search', 'Uninformed Search'], 1),
    (v_mod3_id, v_ai_id, 'Compare blind search and heuristic search algorithm in detail.', ARRAY['July 2025 (Q5a)'], NULL, 'L4 / CO3', ARRAY['Blind Search', 'Heuristic Search'], 2),
    (v_mod3_id, v_ai_id, 'Explain the following concepts with example: i) Heuristic function.', ARRAY['July 2025 (Q6c)'], NULL, 'L2 / CO3', ARRAY['Heuristic Function'], 3),
    (v_mod3_id, v_ai_id, 'Explain A* algorithm. Give one example where A* is suitable to apply.', ARRAY['Jan 2026 (Q5b)'], NULL, 'L2 / CO3', ARRAY['A* Search'], 4),
    (v_mod3_id, v_ai_id, 'Explain the A* search to minimize the total estimated cost.', ARRAY['July 2024 (Q5a)'], NULL, 'L3 / CO3', ARRAY['A* Search'], 5),
    (v_mod3_id, v_ai_id, 'Apply A* search algorithm to find the solution path from the start node (S) to the goal node (G). The heuristic values (h) and travel costs (C) are provided.', ARRAY['Jan 2025 (Q5b Mod3)'], NULL, 'L3 / CO3', ARRAY['A* Search'], 6),
    (v_mod3_id, v_ai_id, 'In the below graph, find the path from A to G using Greedy Best First search and A* search algorithm.', ARRAY['July 2024 (Q6a)'], NULL, 'L3 / CO3', ARRAY['Greedy Best First Search', 'A* Search'], 7),
    (v_mod3_id, v_ai_id, 'Describe A* search algorithm with an example.', ARRAY['July 2025 (Q6a)'], NULL, 'L3 / CO3', ARRAY['A* Search'], 8),
    (v_mod3_id, v_ai_id, 'Describe the principles of greedy best first search as an informed search strategy. How does it make use of heuristic information?', ARRAY['Jan 2026 (Q6a)'], NULL, 'L2 / CO3', ARRAY['Greedy Best First Search', 'Heuristic Information'], 9),
    (v_mod3_id, v_ai_id, 'Write an algorithm for hill climbing search and explain in detail.', ARRAY['July 2024 (Q5b)'], NULL, 'L3 / CO3', ARRAY['Hill Climbing'], 10),
    (v_mod3_id, v_ai_id, 'Solve the following eight-tile puzzle using heuristic function approach and the tree diagram considering the initial and final states.', ARRAY['Jan 2025 (Q6b)'], NULL, 'L2 / CO3', ARRAY['8-tile Puzzle', 'Heuristics'], 11),
    (v_mod3_id, v_ai_id, 'Outline a generic knowledge-based agent''s program and discuss the difference between declarative and procedural approaches.', ARRAY['Jan 2025 (Q5a Mod3)'], NULL, 'L3 / CO3', ARRAY['Knowledge-based Agent', 'Declarative vs Procedural'], 12),
    (v_mod3_id, v_ai_id, 'Describe the Wumpus world environment and the PEAS specification for the knowledge based agent. Explain how the agent navigates.', ARRAY['Jan 2025 (Q6a)'], NULL, 'L2 / CO3', ARRAY['Wumpus World', 'PEAS', 'Knowledge-based Agent'], 13),
    (v_mod3_id, v_ai_id, 'Write a note on Wumpus world problem.', ARRAY['July 2025 (Q5b)'], NULL, 'L2 / CO3', ARRAY['Wumpus World'], 14),
    (v_mod3_id, v_ai_id, 'Explain the syntax and semantics of propositional logic.', ARRAY['July 2024 (Q6b)'], NULL, 'L3 / CO3', ARRAY['Propositional Logic'], 15),
    (v_mod3_id, v_ai_id, 'Write the connectives used to form complex sentence of propositional logic. Give example for each.', ARRAY['July 2025 (Q5c)'], NULL, 'L2 / CO3', ARRAY['Propositional Logic', 'Logical Connectives'], 16),
    (v_mod3_id, v_ai_id, 'Compare proposition logic and predicate logic in detail with example.', ARRAY['July 2025 (Q6b)'], NULL, 'L4 / CO3', ARRAY['Propositional Logic', 'Predicate Logic'], 17),
    (v_mod3_id, v_ai_id, 'Explain the following with examples: (i) Logical Equivalence (ii) Inference Rules (iii) Horn Clauses.', ARRAY['Jan 2026 (Q6b)'], NULL, 'L2 / CO3', ARRAY['Logical Equivalence', 'Inference Rules', 'Horn Clauses'], 18),
    (v_mod3_id, v_ai_id, 'Explain the following concepts with example: ii) Atomic sentence iii) Complex sentence.', ARRAY['July 2025 (Q6c)'], NULL, 'L2 / CO3', ARRAY['Atomic Sentence', 'Complex Sentence'], 19);

    -- Module 4 Questions
    INSERT INTO questions (module_id, subject_id, question_text, exam_cycles, frequency, course_outcome, topic_tags, sort_order) VALUES
    (v_mod4_id, v_ai_id, 'Explain the syntax and semantics of the first order logic.', ARRAY['July 2024 (Q7a)'], NULL, 'L2 / CO2', ARRAY['First Order Logic'], 1),
    (v_mod4_id, v_ai_id, 'Explain the propositional syntax and semantics of First Order Logic (FOL).', ARRAY['Jan 2026 (Q7b)'], NULL, 'L2 / CO4', ARRAY['First Order Logic'], 2),
    (v_mod4_id, v_ai_id, 'What are predicates? Explain its syntax and semantics.', ARRAY['July 2025 (Q7a)'], NULL, 'L2 / CO4', ARRAY['Predicates', 'First Order Logic'], 3),
    (v_mod4_id, v_ai_id, 'Explain the following with respect to first-order logic: (i) Assertions and queries (ii) Numbers, sets and lists (iii) The wumpus world / Kinship domain.', ARRAY['Jan 2025 (Q7a)', 'July 2024 (Q7b)'], NULL, 'L2 / CO2, CO4', ARRAY['First Order Logic', 'Assertions and Queries', 'Wumpus World'], 4),
    (v_mod4_id, v_ai_id, 'Define universal and existential instantiations with examples.', ARRAY['Jan 2025 (Q7a)', 'July 2025 (Q7b)'], NULL, 'L1, L2 / CO4', ARRAY['Universal Instantiation', 'Existential Instantiation'], 5),
    (v_mod4_id, v_ai_id, 'Write appropriate quantifiers for the following: Some students read well, Some students like some books, Some students like all books, All students like some books, All students like no books.', ARRAY['July 2025 (Q8a)'], NULL, 'L3 / CO4', ARRAY['Quantifiers', 'First Order Logic'], 6),
    (v_mod4_id, v_ai_id, 'Apply predicate logic to translate and formalize the following statements: Marcus was a man, Marcus was a Pompeian, All Pompeian were Romans, Caesar was a ruler...', ARRAY['Jan 2025 (Q8a)'], NULL, 'L3 / CO4', ARRAY['Predicate Logic', 'Translation to FOL'], 7),
    (v_mod4_id, v_ai_id, 'Provide examples of how inference can be applied to draw conclusions in a given knowledge base represented FOL.', ARRAY['Jan 2026 (Q7a)'], NULL, 'L2 / CO4', ARRAY['Inference', 'First Order Logic'], 8),
    (v_mod4_id, v_ai_id, 'Explain unification and lifting in detail.', ARRAY['July 2024 (Q8a)'], NULL, 'L3 / CO4', ARRAY['Unification', 'Lifting'], 9),
    (v_mod4_id, v_ai_id, 'Explain the process of unification.', ARRAY['July 2025 (Q8b)'], NULL, 'L3 / CO4', ARRAY['Unification'], 10),
    (v_mod4_id, v_ai_id, 'Explain the concept of resolution in first order logic with appropriate procedure.', ARRAY['July 2025 (Q8a)'], NULL, 'L3 / CO4', ARRAY['Resolution', 'First Order Logic'], 11),
    (v_mod4_id, v_ai_id, 'Explain backward chaining algorithm with an example.', ARRAY['Jan 2025 (Q8b)'], NULL, 'L2 / CO4', ARRAY['Backward Chaining'], 12),
    (v_mod4_id, v_ai_id, 'Outline the process of backward chaining in FOL. Provide examples to illustrate how it works.', ARRAY['Jan 2026 (Q8b)'], NULL, 'L2 / CO4', ARRAY['Backward Chaining', 'First Order Logic'], 13),
    (v_mod4_id, v_ai_id, 'Explain Forward chaining algorithm with an example.', ARRAY['July 2024 (Q8b)'], NULL, 'L3 / CO4', ARRAY['Forward Chaining'], 14),
    (v_mod4_id, v_ai_id, 'Describe the principles of forward chaining in FOL. Provide examples to illustrate how it works.', ARRAY['Jan 2026 (Q8a)'], NULL, 'L2 / CO4', ARRAY['Forward Chaining', 'First Order Logic'], 15),
    (v_mod4_id, v_ai_id, 'Write and explain simple backward chaining algorithm and forward chaining algorithm for first order knowledge bases with example.', ARRAY['July 2025 (Q8b)'], NULL, 'L3 / CO4', ARRAY['Backward Chaining', 'Forward Chaining'], 16),
    (v_mod4_id, v_ai_id, 'Prove the following using Backward and forward chaining: "Solan is a criminal" based on a provided text about hostile nations and missile sales.', ARRAY['Jan 2025 (Q7b)'], NULL, 'L2 / CO4', ARRAY['Backward Chaining', 'Forward Chaining', 'Proof'], 17),
    (v_mod4_id, v_ai_id, 'Consider the following knowledge base regarding Gita and food... Goal: Prove Gita likes almond.', ARRAY['July 2025 (Q7c)'], NULL, 'L3 / CO4', ARRAY['Proof', 'First Order Logic'], 18);

    -- Module 5 Questions
    INSERT INTO questions (module_id, subject_id, question_text, exam_cycles, frequency, course_outcome, topic_tags, sort_order) VALUES
    (v_mod5_id, v_ai_id, 'Explain uncertain knowledge in the context of artificial intelligence. Discuss challenges with the example of diagnosing a toothache.', ARRAY['Jan 2025 (Q10a)'], NULL, 'L2 / CO5', ARRAY['Uncertain Knowledge', 'Toothache Diagnosis'], 1),
    (v_mod5_id, v_ai_id, 'Explain the impact of uncertainty in probabilistic reasoning.', ARRAY['July 2025 (Q9a)'], NULL, 'L2 / CO5', ARRAY['Uncertainty', 'Probabilistic Reasoning'], 2),
    (v_mod5_id, v_ai_id, 'Explain basic probability Notation.', ARRAY['July 2024 (Q9a)'], NULL, 'L3 / CO5', ARRAY['Probability Notation'], 3),
    (v_mod5_id, v_ai_id, 'Explain Independence in Quantifying uncertainty with example.', ARRAY['July 2024 (Q10a)'], NULL, 'L3 / CO5', ARRAY['Independence', 'Quantifying Uncertainty'], 4),
    (v_mod5_id, v_ai_id, 'Explain the inference using full joint distribution.', ARRAY['Jan 2026 (Q9a)'], NULL, 'L2 / CO5', ARRAY['Inference', 'Full Joint Distribution'], 5),
    (v_mod5_id, v_ai_id, 'Explain the concept of inference using full joint probability... Calculate P(cavity v toothache), P(cavity|toothache), P(~cavity|toothache) using provided matrix.', ARRAY['Jan 2025 (Q10b)'], NULL, 'L3 / CO5', ARRAY['Inference', 'Full Joint Probability', 'Conditional Probability'], 6),
    (v_mod5_id, v_ai_id, 'State/Explain Baye''s theorem/rule and its use/utilization in probabilistic reasoning in detail.', ARRAY['Jan 2025 (Q9a)', 'Jan 2026 (Q9b)', 'July 2024 (Q9b)', 'July 2025 (Q9b)'], NULL, 'L2, L3 / CO5', ARRAY['Bayes Theorem', 'Probabilistic Reasoning'], 7),
    (v_mod5_id, v_ai_id, 'Calculate probability a person owns a dog given they walk their pet daily (based on 30% dog ownership, 70% cat, 80% walk dogs, 50% walk cats).', ARRAY['Jan 2025 (Q9a)'], NULL, 'L3 / CO5', ARRAY['Probability Calculation', 'Bayes Theorem'], 8),
    (v_mod5_id, v_ai_id, 'Write representation of Bayes Theorem. Calculate fever probabilities (viral vs bacterial based on provided stats).', ARRAY['July 2025 (Q9c)'], NULL, 'L3 / CO5', ARRAY['Bayes Theorem', 'Probability Calculation'], 9),
    (v_mod5_id, v_ai_id, 'Calculate the exact probability a patient has cancer given a positive test (based on base rate 0.002, 100% accuracy, 98% true positive, 97% true negative).', ARRAY['July 2025 (Q10b)'], NULL, 'L3 / CO5', ARRAY['Probability Calculation', 'Bayes Theorem'], 10),
    (v_mod5_id, v_ai_id, 'Define/Explain Expert Systems, detailing characteristics, components, capabilities, and incapabilities. Provide examples.', ARRAY['Jan 2025 (Q9b)', 'Jan 2026 (Q10a)', 'July 2025 (Q10a)'], NULL, 'L2 / CO5', ARRAY['Expert Systems'], 11),
    (v_mod5_id, v_ai_id, 'Explain knowledge Acquisition in detail.', ARRAY['Jan 2026 (Q10b)', 'July 2024 (Q10b)', 'July 2025 (Q10a)'], NULL, 'L2, L3 / CO5', ARRAY['Knowledge Acquisition'], 12),
    (v_mod5_id, v_ai_id, 'Explain: (i) Knowledge Shell.', ARRAY['Jan 2026 (Q10b)'], NULL, 'L2 / CO5', ARRAY['Knowledge Shell'], 13);

END $$;
