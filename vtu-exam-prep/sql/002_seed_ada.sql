-- ADA Seed Data

INSERT INTO subjects (id, name, course_code) VALUES 
('ada', 'Analysis and Design of Algorithms', 'BCS401');

-- Store subject ID and create module IDs
DO $$
DECLARE
    v_ada_id TEXT := 'ada';
    v_mod1_id UUID := gen_random_uuid();
    v_mod2_id UUID := gen_random_uuid();
    v_mod3_id UUID := gen_random_uuid();
    v_mod4_id UUID := gen_random_uuid();
    v_mod5_id UUID := gen_random_uuid();
BEGIN
    INSERT INTO modules (id, subject_id, module_number, title, description) VALUES
    (v_mod1_id, v_ada_id, 1, 'Algorithmic Fundamentals and Asymptotic Analysis', 'Foundational theories of algorithm efficiency, asymptotic notations, and mathematical analysis of recursive and non-recursive algorithms.'),
    (v_mod2_id, v_ada_id, 2, 'Divide and Conquer / Decrease and Conquer', 'Structural paradigms of Brute Force exhaustions, Decrease-and-Conquer logic, and Divide-and-Conquer subdivisions.'),
    (v_mod3_id, v_ada_id, 3, 'Space-Time Tradeoffs and Transform-and-Conquer', 'Complex data structure manipulation, AVL trees, Heaps, and Horspool algorithm.'),
    (v_mod4_id, v_ada_id, 4, 'Dynamic Programming and Greedy Method', 'Advanced optimization paradigms including pathfinding and network spanning within graphs.'),
    (v_mod5_id, v_ada_id, 5, 'Computational Intractability and Coping Mechanisms', 'Limitations of computational power, P/NP classes, Backtracking, and Branch-and-Bound heuristics.');

    -- Module 1 Questions
    INSERT INTO questions (module_id, subject_id, question_text, exam_cycles, frequency, course_outcome, topic_tags, sort_order) VALUES
    (v_mod1_id, v_ada_id, 'Explain the various steps in algorithm design and analysis process with the flow diagram. (Alternately phrased as: Explain fundamentals of algorithmic problem solving / With a neat diagram explain different steps in designing and analyzing algorithm.)', ARRAY['July 2024', 'Jan 2025', 'July 2025', 'Jan 2026'], 4, 'CO1', ARRAY['Algorithm Design Process', 'Algorithmic Fundamentals'], 1),
    (v_mod1_id, v_ada_id, 'Give formal and informal definitions of asymptotic notations. (Alternately phrased as: Explain asymptotic notations Big Oh, Big Omega and Big Theta notations / List and explain asymptotic notations used to compare the orders of growth with an example each.)', ARRAY['July 2024', 'Jan 2025', 'July 2025', 'Jan 2026'], 4, 'CO1', ARRAY['Asymptotic Notations', 'Big Oh', 'Big Omega', 'Big Theta'], 2),
    (v_mod1_id, v_ada_id, 'Explain the general plan of mathematical analysis of recursive algorithm. Derive its efficiency / Develop recursive algorithm for computing factorial of a positive number / Design algorithm for tower of Hanoi problem and obtain time complexity.', ARRAY['July 2024', 'Jan 2025', 'July 2025', 'Jan 2026'], 4, 'CO1', ARRAY['Recursive Algorithms', 'Mathematical Analysis', 'Tower of Hanoi', 'Factorial'], 3),
    (v_mod1_id, v_ada_id, 'Write an algorithm to search an element in an array using sequential search. Discuss the best case, worst case and average case efficiency of this algorithm.', ARRAY['July 2024', 'Jan 2025'], 2, 'CO1', ARRAY['Sequential Search', 'Time Complexity Analysis'], 4),
    (v_mod1_id, v_ada_id, 'Prove that if t1(n) ∈ O(g1(n)) and t2(n) ∈ O(g2(n)), then t1(n) + t2(n) ∈ O(max(g1(n), g2(n)))', ARRAY['July 2025', 'Jan 2026'], 2, 'CO1', ARRAY['Asymptotic Notations', 'Mathematical Proof'], 5),
    (v_mod1_id, v_ada_id, 'Write an algorithm to find the max element in an array of n elements. Give the mathematical analysis of this non-recursive algorithm.', ARRAY['July 2025'], 1, 'CO1', ARRAY['Non-recursive Algorithms', 'Mathematical Analysis'], 6),
    (v_mod1_id, v_ada_id, 'With the algorithm derive the worst case efficiency for selection sort / Bubble sort.', ARRAY['July 2025'], 1, 'CO1', ARRAY['Selection Sort', 'Bubble Sort', 'Time Complexity Analysis'], 7),
    (v_mod1_id, v_ada_id, 'Solve the following recurrence: x(n) = x(n - 1) + ... for n > 1, x(1) = 0.', ARRAY['Jan 2026'], 1, 'CO1', ARRAY['Recurrence Relations'], 8),
    (v_mod1_id, v_ada_id, 'Compare the order of 1/2 n(n - 1) and n^2.', ARRAY['Jan 2026'], 1, 'CO1', ARRAY['Order of Growth', 'Asymptotic Notations'], 9);

    -- Module 2 Questions
    INSERT INTO questions (module_id, subject_id, question_text, exam_cycles, frequency, course_outcome, topic_tags, sort_order) VALUES
    (v_mod2_id, v_ada_id, 'Design an algorithm for merge sort and sort the list "EXAMPLE" (or similar arrays) in alphabetical order using merge sort. Derive its time complexity.', ARRAY['July 2024', 'Jan 2025', 'July 2025', 'Jan 2026'], 4, 'CO2', ARRAY['Merge Sort', 'Divide and Conquer', 'Tracing'], 1),
    (v_mod2_id, v_ada_id, 'Design an algorithm for quick sort. Sort the list (e.g., 65, 70, 75, 80, 85, 60, 55, 50, 45 or E,X,A,M,P,L,E). Also derive the worst case complexity of quick sort.', ARRAY['July 2024', 'Jan 2025', 'July 2025', 'Jan 2026'], 4, 'CO2', ARRAY['Quick Sort', 'Divide and Conquer', 'Tracing', 'Time Complexity'], 2),
    (v_mod2_id, v_ada_id, 'Write an algorithm to sort the numbers using insertion sort. Discuss its efficiency / Illustrate the tracing of insertion sort algorithm for the following set of numbers.', ARRAY['July 2024', 'Jan 2025', 'July 2025', 'Jan 2026'], 4, 'CO2', ARRAY['Insertion Sort', 'Decrease and Conquer', 'Tracing'], 3),
    (v_mod2_id, v_ada_id, 'Apply the DFS based algorithm to solve the topological sorting problem for the following graph / Obtain the topological ordering for the following graph using source removal method.', ARRAY['July 2024', 'Jan 2025', 'Jan 2026'], 3, 'CO2', ARRAY['Topological Sorting', 'DFS', 'Source Removal Method', 'Decrease and Conquer'], 4),
    (v_mod2_id, v_ada_id, 'Explain Strassen''s matrix multiplication approach with example and derive its time complexity.', ARRAY['July 2024', 'July 2025'], 2, 'CO2', ARRAY['Strassen''s Matrix Multiplication', 'Divide and Conquer'], 5),
    (v_mod2_id, v_ada_id, 'Distinguish between decrease & conquer and divide & conquer algorithm design techniques with block diagram. / What are the three major variations of decrease and conquer technique?', ARRAY['July 2024', 'Jan 2026'], 2, 'CO2', ARRAY['Divide and Conquer', 'Decrease and Conquer', 'Algorithm Design Techniques'], 6),
    (v_mod2_id, v_ada_id, 'Write algorithm for pre-order, post order and in order traversals of a tree. Write pre-order, in-order and post order for the given tree.', ARRAY['Jan 2025'], 1, 'CO2', ARRAY['Binary Tree Traversals', 'Divide and Conquer'], 7);

    -- Module 3 Questions
    INSERT INTO questions (module_id, subject_id, question_text, exam_cycles, frequency, course_outcome, topic_tags, sort_order) VALUES
    (v_mod3_id, v_ada_id, 'Define AVL tree. Construct AVL tree for the list 5, 6, 8, 3, 2, 4, 7 (or similar) by successive insertion / Explain the four types of rotations.', ARRAY['July 2024', 'Jan 2025', 'July 2025', 'Jan 2026'], 4, 'CO3', ARRAY['AVL Tree', 'Transform-and-Conquer', 'Tree Rotations'], 1),
    (v_mod3_id, v_ada_id, 'Define heap. Sort the following lists by heapsort / Design an algorithm to construct a heap by bottom up approach.', ARRAY['July 2024', 'Jan 2025', 'July 2025', 'Jan 2026'], 4, 'CO3', ARRAY['Heap', 'Heapsort', 'Transform-and-Conquer'], 2),
    (v_mod3_id, v_ada_id, 'Design Horspool''s algorithm for string matching. Apply algorithm to find the pattern BARBER in the text JIM SAW ME IN A BARBERSHOP (or DEMOCRATIC).', ARRAY['July 2024', 'Jan 2025', 'July 2025', 'Jan 2026'], 4, 'CO4', ARRAY['Horspool''s Algorithm', 'String Matching', 'Space-Time Tradeoffs'], 3),
    (v_mod3_id, v_ada_id, 'Write the algorithm for comparison counting sort. Discuss its efficiency / Apply the same to sort the list 62, 31, 84, 96, 19, 47.', ARRAY['Jan 2025', 'Jan 2026'], 2, 'CO4', ARRAY['Comparison Counting Sort', 'Space-Time Tradeoffs'], 4),
    (v_mod3_id, v_ada_id, 'Define 2-3 tree. Give the worst case efficiency of operations. Build 2-3 tree for the list of keys.', ARRAY['July 2024'], 1, 'CO3', ARRAY['2-3 Tree', 'Transform-and-Conquer'], 5);

    -- Module 4 Questions
    INSERT INTO questions (module_id, subject_id, question_text, exam_cycles, frequency, course_outcome, topic_tags, sort_order) VALUES
    (v_mod4_id, v_ada_id, 'Write Warshall''s algorithm and apply the same to compute transitive closure of a directed graph.', ARRAY['July 2024', 'Jan 2025', 'July 2025', 'Jan 2026'], 4, 'CO4', ARRAY['Warshall''s Algorithm', 'Transitive Closure', 'Dynamic Programming'], 1),
    (v_mod4_id, v_ada_id, 'Construct minimum cost spanning tree using Kruskal''s algorithm for the following graph.', ARRAY['July 2024', 'Jan 2025', 'July 2025', 'Jan 2026'], 4, 'CO4', ARRAY['Kruskal''s Algorithm', 'Minimum Spanning Tree', 'Greedy Method'], 2),
    (v_mod4_id, v_ada_id, 'Write Huffman''s algorithm. Construct Huffman tree and resulting code word for the following probabilities. Encode/decode the text.', ARRAY['July 2024', 'Jan 2025', 'July 2025', 'Jan 2026'], 4, 'CO4', ARRAY['Huffman Coding', 'Greedy Method'], 3),
    (v_mod4_id, v_ada_id, 'Apply Dijkstra''s algorithm to find the single source shortest path for given graph by considering ''s'' as source vertex.', ARRAY['July 2024', 'Jan 2025', 'July 2025'], 3, 'CO4', ARRAY['Dijkstra''s Algorithm', 'Shortest Path', 'Greedy Method'], 4),
    (v_mod4_id, v_ada_id, 'Construct a minimum cost spanning tree using Prims algorithm for the following graph.', ARRAY['Jan 2026'], 1, 'CO4', ARRAY['Prim''s Algorithm', 'Minimum Spanning Tree', 'Greedy Method'], 5);

    -- Module 5 Questions
    INSERT INTO questions (module_id, subject_id, question_text, exam_cycles, frequency, course_outcome, topic_tags, sort_order) VALUES
    (v_mod5_id, v_ada_id, 'Apply backtracking to solve the instance of the sum of subset problem S = {3, 5, 6, 7} and d = 15. Construct a state space tree.', ARRAY['July 2024', 'Jan 2025', 'July 2025', 'Jan 2026'], 4, 'CO5/CO6', ARRAY['Backtracking', 'Subset Sum Problem', 'State Space Tree'], 1),
    (v_mod5_id, v_ada_id, 'Solve the following instance of the knapsack problem by the branch-and-bound algorithm. Construct state-space tree.', ARRAY['July 2024', 'Jan 2025', 'July 2025', 'Jan 2026'], 4, 'CO6', ARRAY['Branch and Bound', 'Knapsack Problem', 'State Space Tree'], 2),
    (v_mod5_id, v_ada_id, 'Explain the following with example: (i) P problem (ii) NP problem / NP - complete and NP-Hard problem.', ARRAY['Jan 2025', 'July 2025', 'Jan 2026'], 3, 'CO5', ARRAY['P and NP Problems', 'NP-Complete', 'NP-Hard'], 3),
    (v_mod5_id, v_ada_id, 'Construct state space tree to solve 4 queens problem / Explain N-Queen''s problem with example using backtracking approach.', ARRAY['July 2024', 'Jan 2025', 'July 2025'], 3, 'CO6', ARRAY['Backtracking', 'N-Queens Problem', 'State Space Tree'], 4),
    (v_mod5_id, v_ada_id, 'What is decision tree? Construct decision tree for the three element insertion sort.', ARRAY['Jan 2025', 'Jan 2026'], 2, 'CO5', ARRAY['Decision Trees', 'Insertion Sort Lower Bound'], 5),
    (v_mod5_id, v_ada_id, 'Explain greedy approximation algorithm to solve discrete knapsack problem.', ARRAY['July 2024'], 1, 'CO5', ARRAY['Greedy Approximation', 'Discrete Knapsack Problem', 'Approximation Algorithms'], 6);

END $$;
